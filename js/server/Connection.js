jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');

exports = Class(RTJPProtocol, function(supr) {
	
	this.init = function() {
		supr(this, 'init')
		this._requestHandlers = {}
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE_ITEM', bind(this, function(args){
			var itemId = args.id
			this._log('subscribing to item', itemId)
			this.server.getItem(itemId, bind(this, function(item) {
				var callback = bind(this, 'sendFrame', 'FIN_EVENT_ITEM_MUTATED')
				this._itemSubscriptions[itemId] = this.server.subscribeToItemMutations(item, callback)
				this.sendFrame('FIN_EVENT_ITEM_SNAPSHOT', item.getProperties())
			}))
		}))

		this.handleRequest('FIN_REQUEST_MUTATE_ITEM', bind(this, function(mutation){
			this.server.handleMutation(mutation);
		}))

	}
	
/* Connection
 ************/
	this.connectionMade = function() {
		this._log('connectionMade');
		this._itemSubscriptions = {};
	}
	
	this.connectionLost = function() {
		logger.log('connection lost - unsubscribing from item mutation subscriptions');
		for (var itemId in this._itemSubscriptions) {
			this.server.unsubscribeFromItemMutations(itemId, this._itemSubscriptions[itemId]);
		}
	}
	
/* Requests
 **********/
	this.handleRequest = function(requestName, callback) {
		this._requestHandlers[requestName] = callback
	}

	this.frameReceived = function(id, name, args) {
		this._log('frameReceived', id, name, JSON.stringify(args));
		if (!this._requestHandlers[name]) {
			logger.warn('Received request without handler', name)
			return
		}
		this._requestHandlers[name](args)
	}
	
/* Util
 ******/
	this.sendFrame = function(name, args) {
		this._log('sendFrame', name, JSON.stringify(args));
		supr(this, 'sendFrame', arguments);
	}

	this._log = function() {
		var args = Array.prototype.slice.call(arguments);
		if (this.transport._socket) {
			args.unshift(this.transport._socket._session.key);
		}
		logger.log.apply(this, args);
	}
})
