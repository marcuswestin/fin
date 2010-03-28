jsio('from shared.javascript import Class, bind')
jsio('from net.protocols.rtjp import RTJPProtocol')

exports = Class(RTJPProtocol, function(supr) {
	
	this.getSessionId = function() { 
		if (this.transport._socket && this.transport._socket._session) {
			return this.transport._socket._session.key
		} else {
			return (this._fakeSessionId || (this._fakeSessionId = 'FAKE_CONNECTION_ID_' + new Date().getTime()))
		}
	}

	this.init = function() {
		supr(this, 'init')
		this._requestHandlers = {}
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE_ITEM', bind(this, function(args){
			var itemId = args.id
			var onMutated = bind(this, function(mutation) {
				if (mutation._session == this.getSessionId()) { return }
				this.sendFrame('FIN_EVENT_ITEM_MUTATED', mutation)
			})
			this._itemSubs[itemId] = this.server.subscribeToItemMutations(itemId, onMutated, 
				bind(this, 'sendFrame', 'FIN_EVENT_ITEM_SNAPSHOT'))
		}))

		this.handleRequest('FIN_REQUEST_ITEM_EXISTS', bind(this, function(request) {
			this.server.exists(request._id, bind(this, function(response) {
				response._requestId = request._requestId
				this.sendFrame('FIN_RESPONSE_ITEM_EXISTS', response)
			}))
		}))

		this.handleRequest('FIN_REQUEST_CREATE_ITEM', bind(this, function(request) {
			this.server.createItem(request.data, bind(this, function(item) {
				var response = { _requestId: request._requestId, item: item.getData() }
				this.sendFrame('FIN_RESPONSE_CREATE_ITEM', response)
			}))
		}))

		this.handleRequest('FIN_REQUEST_MUTATE_ITEM', bind(this, function(mutation){
			// TODO We should label which user made the change here
			mutation._session = this.getSessionId()
			this.server.handleMutation(mutation)
		}))
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE_ITEMSET', bind(this, function(args) {
			var itemSetId = args.id,
				onMutated = bind(this, '_onItemSetMutated')
			this._itemSetSubs[itemSetId] = this.server.subscribeToItemSet(itemSetId, onMutated)
		}))
		
		this.handleRequest('FIN_REQUEST_ADD_REDUCTION', bind(this, function(args) {
			var itemSetId = args.id,
				reductionId = args.reductionId
			this.server.addItemSetReduction(itemSetId, reductionId, this._itemSetSubs[itemSetId])
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
			this.server.unsubscribeFromItemSetMutations(itemSetId, this._itemSetSubs[itemSetId])
		}
	}
	
/* Requests
 **********/
	this.handleRequest = function(requestName, callback) {
		this._requestHandlers[requestName] = callback
	}

	this.frameReceived = function(id, name, args) {
		this._log('recv', id, name, JSON.stringify(args))
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
		this._log('send', name, JSON.stringify(args))
		supr(this, 'sendFrame', arguments)
	}

	this._log = function() {
		var args = Array.prototype.slice.call(arguments)
		if (this.transport._socket) {
			if (this.transport._socket._session) {
				args.unshift(this.transport._socket._session.key)
			}
		}
		logger.log.apply(logger, args)
	}
})
