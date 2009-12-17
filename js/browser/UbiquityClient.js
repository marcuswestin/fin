jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');
jsio('import net, logging');
jsio('import common.itemFactory');

var logger = logging.getLogger('common.UbiquityClient');
logger.setLevel(0);

exports = Class(RTJPProtocol, function(supr) {
	this.init = function(playerFactory) {
		supr(this, 'init');
		this._isConnected = false;
		this._subscribedItems = {};
		this._labelCallbacks = {};
		common.itemFactory.subscribe('ItemCreated', bind(this, '_onItemCreated'));
	}
	
	this.connect = function(transport, url, onConnectedCallback) {
		logger.log('Connecting...')
		this.url = url || this.url;
		this.transport = transport || this.transport || 'csp';
		this._onConnectedCallback = onConnectedCallback;
		if(!this._isConnected) {
			net.connect(this, this.transport, {url: this.url});
		}
	}
	
	this.sendFrame = function(name, args) {
		logger.log('sendFrame', name, JSON.stringify(args));
		supr(this, 'sendFrame', arguments);
	}
	
	this.subscribeToItem = function(item) {
		if (this._subscribedItems[item.getId()]) { return; }
		this._subscribedItems[item.getId()] = true;
		var args = { id: item.getId() };
		this.sendFrame('ITEM_SUBSCRIBE', args);
	}
	
	this.getItemsForLabel = function(label, callback) {
		this._labelCallbacks[label] = callback;
		this.sendFrame('LABEL_GET_ITEMS', { label: label });
	}
	
	/* Private */
	this._onItemCreated = function(item) {
		item.subscribe('PropertySet', bind(this, 'onItemPropertySet', item.getId()));
		this.subscribeToItem(item);
	}
	
	this.connectionMade = function() {
		this._isConnected = true;
	}
	
	this.connectionLost = function() {
		this._isConnected = false;
	}
	
	/* Browser event handling */
	this.onItemPropertySet = function(itemId, propertyName, propertyValue) {
		this.sendFrame('ITEM_PROPERTY_SET', { id: itemId, name: propertyName, value: propertyValue });
	}
	
	/* Server event handling */
	this.frameReceived = function(id, name, args) {
		logger.log('frameReceived', id, name, JSON.stringify(args));
		
		switch(name) {
			case 'WELCOME':
				logger.log('Connected!')
				this._onConnectedCallback(args.labels);
				break;
			case 'ITEM_SNAPSHOT':
				setTimeout(function(){ common.itemFactory.loadItemSnapshot(args); });
				break;
			case 'ITEM_PROPERTY_UPDATED':
				var item = common.itemFactory.getItem(args.id);
				setTimeout(function(){ item.updateProperty(args.name, args.value); });
				break;
			case 'LABEL_ITEMS':
				var callback = this._labelCallbacks[args.label];
				delete this._labelCallbacks[args.label];
				var items = [];
				for (var i=0, itemId; itemId = args.itemIds[i]; i++) {
					var item = common.itemFactory.getItem(itemId);
					items.push(item);
				}
				setTimeout(function(){ callback(args.label, items); });
				break;
		}
	}
});
