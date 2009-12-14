jsio('from common.javascript import Class, Publisher, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');
jsio('import net, logging');

var logger = logging.getLogger('common.UbiquityClient');
logger.setLevel(0);

exports = Class(RTJPProtocol, function(supr) {
	this.init = function(playerFactory) {
		supr(this, 'init');
		this._isConnected = false;
		this._subscribedItems = {};
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
	
	this.isConnected = function() { return this._isConnected; }
	
	this.subscribeToItem = function(item) {
		if (this._subscribedItems[item.getId()]) { return; }
		this._subscribedItems[item.getId()] = true;
		var args = { id: item.getId() };
		this.sendFrame('ITEM_SUBSCRIBE', args);
	}
	
	/* Private */
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
				this._onConnectedCallback(args.subscriptions);
				break;
			case 'ITEM_SNAPSHOT':
				setTimeout(function(){ common.itemFactory.loadItemSnapshot(args); });
				break;
			case 'ITEM_PROPERTY_UPDATED':
				var item = common.itemFactory.getItem(args.id);
				setTimeout(function(){ item.setProperty(args.name, args.value, true); });
				break;
		}
	}
});
