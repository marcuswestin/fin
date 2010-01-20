jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');
jsio('import net, logging');
jsio('import common.itemFactory');
jsio('import browser.overlay');
jsio('import browser.loginManager');

var logger = logging.getLogger(jsio.__path);

exports = Class(RTJPProtocol, function(supr) {

	this.transport = 'csp';
	this.url = "http://" + (document.domain || "127.0.0.1") + ":5555";

	this.init = function(playerFactory) {
		supr(this, 'init');
		this._isConnected = false;
		this._subscribedItems = {};
		this._labelCallbacks = {};
		this._itemCreationCallbacks = {};
		common.itemFactory.subscribe('ItemCreated', bind(this, '_onItemCreatedInFactory'));
	}
	
	this._onItemCreatedInFactory = function(item) {
		item.subscribe('Mutating', bind(this, 'onItemMutating'));
		this.subscribeToItem(item);
	}

/* Commands
 **********/
	this.connect = function(onConnectedCallback) {
		if (this._isConnected) { 
			onConnectedCallback();
		} else if (this._onConnectedCallbacks) { 
			this._onConnectedCallbacks.push(onConnectedCallback);
		} else {
			this._onConnectedCallbacks = [onConnectedCallback];
			net.connect(this, this.transport, {url: this.url});
		}
	}

	this.createItem = function(type, callback) {
		if (this._itemCreationCallbacks[type]) { return; } // already in process of creating an item of this type
		this._itemCreationCallbacks[type] = callback;
		this.sendFrame('REQUEST_CREATE_ITEM', { type: type })
	}
	
	this.createLabel = function(label, mapCode, filterCode) {
		this.sendFrame('REQUEST_CREATE_LABEL', { label: label, map: mapCode, filter: filterCode });
	}
	
	this.subscribeToItem = function(item) {
		if (this._subscribedItems[item.getId()]) { return; }
		this._subscribedItems[item.getId()] = true;
		var args = { id: item.getId() };
		this.sendFrame('ITEM_SUBSCRIBE', args);
	}
	
	this.getItemsForLabel = function(label, callback) {
		this._labelCallbacks[label] = callback;
		this.sendFrame('LABEL_GET_LIST', { label: label.toString() });
	}
	
	this.connectionMade = function() {
		this._isConnected = true;
	}
	
	this.connectionLost = function() {
		this._isConnected = false;
	}
	
	this.onItemMutating = function(mutation) {
		this.sendFrame('ITEM_MUTATING', { mutation: mutation });
	}
	
/* Server event handling 
 ***********************/
	this.frameReceived = function(id, name, args) {
		logger.log('frameReceived', id, name, JSON.stringify(args));
		
		switch(name) {
			case 'DEMAND_AUTHENTICATION':
				var callback = bind(this, function(email, password) {
					this.sendFrame('AUTHENTICATE', { email: email, password: password });
				});
				
				browser.overlay.show(browser.loginManager.getElement(), true); 
				browser.loginManager.requestAuthentication(callback, args.message);
				break;
			case 'WELCOME':
				logger.log('Connected!')
				browser.overlay.hide();
				for (var i=0; i < this._onConnectedCallbacks.length; i++) {
					this._onConnectedCallbacks[i]();
				}
				delete this._onConnectedCallbacks;
				break;
			case 'ITEM_SNAPSHOT':
				setTimeout(bind(common.itemFactory, 'loadItemSnapshot', args), 0);
				break;
			case 'ITEM_MUTATED':
				var mutation = args.mutation;
				var item = common.itemFactory.getItem(args.mutation._id);
				setTimeout(bind(item, 'applyMutation', args.mutation, false), 0);
				break;
			case 'LABELS':
				setTimeout(bind(gDrawer, 'addLabels', args.labels), 0);
				break;
			case 'LABEL_LIST':
				var callback = this._labelCallbacks[args.label];
				delete this._labelCallbacks[args.label];
				var items = [];
				for (var i=0, listItem; listItem = args.list[i]; i++) {
					var item = common.itemFactory.getItem(listItem.id);
					item.setType(listItem.type);
					items.push(item);
				}
				setTimeout(function(){ callback(args.label, items); });
				break;
			case 'ITEM_CREATED':
				var callback = this._itemCreationCallbacks[args.type];
				delete this._itemCreationCallbacks[args.type];
				var item = common.itemFactory.getItem(args._id);
				item.setType(args.type);
				callback(item);
				break;
			default:
				logger.warn('Unknown frame type received', id, name, JSON.stringify(args));
				break;
		}
	}
});
