jsio('from common.javascript import Class, bind')
jsio('from net.protocols.rtjp import RTJPProtocol')

exports = Class(RTJPProtocol, function(supr) {
	
	this.init = function() {
		supr(this, 'init')
		this._requestHandlers = {}
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE_ITEM', bind(this, function(args){
			var itemId = args.id
			this._log('subscribing to item', itemId)
			var onMutated = bind(this, function(mutation) {
				this.sendFrame('FIN_EVENT_ITEM_MUTATED', mutation)
			})
			this._itemSubs[itemId] = this.server.subscribeToItemMutations(itemId, onMutated, 
				bind(this, 'sendFrame', 'FIN_EVENT_ITEM_SNAPSHOT'))
		}))

		this.handleRequest('FIN_REQUEST_MUTATE_ITEM', bind(this, function(mutation){
			this.server.handleMutation(mutation)
		}))
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE_ITEMSET', bind(this, function(request) {
			var onMutated = bind(this, '_onItemSetMutated')
			this._itemSetSubs = this.server.subscribeToItemSetMutations(request.id, onMutated, 
				bind(this, 'sendFrame', 'FIN_EVENT_ITEMSET_SNAPSHOT'))
		}))
	}
	
/* Connection
 ************/
	this.connectionMade = function() {
		this._log('connectionMade')
		this._itemSubs = {}
		this._itemSetSubs = {}
	}
	
	this.connectionLost = function() {
		logger.log('connection lost - unsubscribing from item mutation subscriptions')
		for (var itemId in this._itemSubs) {
			this.server.unsubscribeFromItemMutations(itemId, this._itemSubs[itemId])
		}
		for (var itemSetId in this._itemSetSubs) {
			this.server.unsubscribeFromItemSetMutations(itemSetId, this._itemSetSubs[itemId])
		}
	}
	
/* Requests
 **********/
	this.handleRequest = function(requestName, callback) {
		this._requestHandlers[requestName] = callback
	}

	this.frameReceived = function(id, name, args) {
		this._log('frameReceived', id, name, JSON.stringify(args))
		if (!this._requestHandlers[name]) {
			logger.warn('Received request without handler', name)
			return
		}
		this._requestHandlers[name](args)
	}

/* Item sets
 ***********/

	this._onItemSetMutated = function(mutation) {
		this.sendFrame('FIN_EVENT_ITEMSET_MUTATED', mutation)
	}

/* Util
 ******/
	this.sendFrame = function(name, args) {
		this._log('sendFrame', name, JSON.stringify(args))
		supr(this, 'sendFrame', arguments)
	}

	this._log = function() {
		var args = Array.prototype.slice.call(arguments)
		if (this.transport._socket) {
			args.unshift(this.transport._socket._session.key)
		}
		logger.log.apply(this, args)
	}
})
