jsio('from shared.javascript import Class, bind')

jsio('import shared.keys')

jsio('import net.protocols.rtjp')

exports = Class(net.protocols.rtjp.RTJPProtocol, function(supr) {

	this._authenticatedUser = true // true disable authentication requirement
	
	this.init = function(id, redisClient) {
		supr(this, 'init')
		this._id = id
		this._redisClient = redisClient
		this._requestHandlers = {}
		
		this._setupHandlers()
	}
	
	this.connectionLost = function() {
		this._log('connection lost - closing redis client')
		this._redisClient.close()
	}
	
	this._setupHandlers = function() {	
		this._channelMessageHandler = bind(this, function(channel, message) {
			// TODO if they don't have "length", they are probably numbers instead - don't convert to strings
			// channel and message come in as byte arrays - convert to arrays and then to strings
			channel = String.fromCharCode.apply(String, Array.prototype.slice.call(channel, 0))
			message = String.fromCharCode.apply(String, Array.prototype.slice.call(message, 0))
			this.sendFrame('FIN_EVENT_CHANNEL_MESSAGE', { channel: channel, message: message })
		})
		
		this._itemChannelHandler = bind(this, function(channel, mutationBytes) {
			// The first byte gives length of connection id
			var idLength = mutationBytes[0] - 48,
				idBytesArray = Array.prototype.splice.call(mutationBytes, 1, idLength),
				originId = String.fromCharCode.apply(String, idBytesArray)
			
			if (originId == this._id) { return }
			
			var JSONBytesArray = Array.prototype.slice.call(mutationBytes, 1),
				mutationJSON = String.fromCharCode.apply(String, JSONBytesArray)
			
			this.sendFrame('FIN_EVENT_ITEM_MUTATED', mutationJSON)
		})
		
		this.handleRequest('FIN_REQUEST_SUBSCRIBE', bind(this, function(args) {
			var itemId = args.id,
				propName = args.prop,
				channel = shared.keys.getItemPropertyChannel(itemId, propName),
				key = shared.keys.getItemPropertyKey(itemId, propName)
			
			this._redisClient.subscribeTo(channel, this._itemChannelHandler)
			// fake an item mutation event
			this.server.data('get', key, bind(this, function(byteValue) {
				var value = String.fromCharCode.apply(String, Array.prototype.slice.call(byteValue, 0)),
					mutation = { op: 'set', args: [key, value] }
				
				logger.log("Retrieved data", key, value)
				this.sendFrame('FIN_EVENT_ITEM_MUTATED', JSON.stringify(mutation))
			}))
		}))

		this.handleRequest('FIN_REQUEST_UNSUBSCRIBE', bind(this, function(channel) {
			this._redisClient.unsubscribeFrom(channel)
		}))
		
		this.handleRequest('FIN_REQUEST_CREATE_ITEM', bind(this, function(request) {
			this.server.createItem(request.data, bind(this, function(itemData) {
				var response = { _requestId: request._requestId, data: itemData }
				this.sendFrame('FIN_RESPONSE', response)
			}))
		}))
		
		this.handleRequest('FIN_REQUEST_MUTATE_ITEM', bind(this, function(mutation){
			// TODO We should label which user made the change here
			if (typeof this._authenticatedUser == 'string') { mutation._user = this._authenticatedUser }
			this.server.mutateItem(mutation, this._id)
		}))

		// TODO: get Reduction handler to work
		this.handleRequest('FIN_REQUEST_ADD_REDUCTION', bind(this, function(args) {
			var itemSetId = args.id,
				reductionId = args.reductionId
			this.server.addItemSetReduction(itemSetId, reductionId, this._itemSetSubs[itemSetId])
		}))
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
		if (!this._authenticatedUser) {
			this.sendFrame('FIN_DEMAND_AUTHENTICATE')
			return
		}
		this._requestHandlers[name](args)
	}

/* Util
 ******/
	this.sendFrame = function(name, args) {
		this._log('send', name, JSON.stringify(args))
		try {
			supr(this, 'sendFrame', arguments)
		} catch(e) {
			logger.error("when writing", e, name, JSON.stringify(args))
		}
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
