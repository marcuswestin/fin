jsio('from shared.javascript import Class, bind')

jsio('import shared.keys')
jsio('import shared.mutations')

jsio('import net.protocols.rtjp')

exports = Class(net.protocols.rtjp.RTJPProtocol, function(supr) {

	this.init = function(id, redisClient) {
		supr(this, 'init')
		this._id = id
		this._redisClient = redisClient
		this._requestHandlers = {}
		
		this._setupHandlers()
	}
	
	this.connectionMade = function() {
		supr(this, 'connectionMade', arguments)
		this._clientConnected = true
	}
	
	this.connectionLost = function() {
		this._log('connection lost - closing redis client')
		this._clientConnected = false
		// TODO do we need to unsubscribe from redis channels?
		this._redisClient.close()
		delete this._redisClient
	}
	
	this.getId = function() { return this._id }
	
	this._setupHandlers = function() {	
		this._queryChannelHandler = bind(this, function(channelBytes, messageBytes) {
			var message = messageBytes.toString()
			if (!this._clientConnected) {
				logger.warn("Received query mutation event even though redis client is closed", message)
				return;
			}
			this.sendFrame('FIN_EVENT_QUERY_MUTATED', message)
		})
		
		this._itemChannelHandler = bind(this, function(channel, mutationBytes) {
			var mutationInfo = shared.mutations.parseMutationBytes(mutationBytes)
			if (mutationInfo.originId == this._id) { return }
			if (!this._clientConnected) {
				logger.warn("Received item mutation event even though redis client is closed", mutationInfo.json)
				return
			}
			this.sendFrame('FIN_EVENT_ITEM_MUTATED', mutationInfo.json)
		})
		
		this.handleRequest('FIN_REQUEST_OBSERVE', bind(this, function(args) {
			var itemId = args.id,
				propName = args.prop,
				channel = shared.keys.getItemPropertyChannel(itemId, propName),
			
			logger.log("Subcribe to item channel", channel)
			this._redisClient.subscribeTo(channel, this._itemChannelHandler)
			
			if (args.mute) { return }
			// fake an item mutation event
			this.server.getItemProperty(itemId, propName, bind(this, function(value, key) {
				var mutation = { op: 'set', id: itemId, prop: propName, args: [value] }
				this.sendFrame('FIN_EVENT_ITEM_MUTATED', JSON.stringify(mutation))
			}))
		}))
		
		this.handleRequest('FIN_REQUEST_UNSUBSCRIBE', bind(this, function(channel) {
			this._redisClient.unsubscribeFrom(channel)
		}))
		
		this.handleRequest('FIN_REQUEST_QUERY', bind(this, function(queryJSON) {
			var channel = shared.keys.getQueryChannel(queryJSON)
			
			this._redisClient.subscribeTo(channel, this._queryChannelHandler)
			
			this.server.getQuerySet(queryJSON, bind(this, function(membersBytes) {
				var members = []
				for (var i=0, memberBytes; memberBytes = membersBytes[i]; i++) {
					members.push(memberBytes.toString())
				}
				
				var mutation = { op: 'sadd', args: members, id: shared.keys.getQueryChannel(queryJSON) }
				
				this.sendFrame('FIN_EVENT_QUERY_MUTATED', JSON.stringify(mutation))
			}))
		}))
		
		this.handleRequest('FIN_REQUEST_CREATE_ITEM', bind(this, function(request) {
			this.server.createItem(request.data, this, bind(this, function(itemData) {
				var response = { _requestId: request._requestId, data: itemData }
				this.sendFrame('FIN_RESPONSE', response)
			}))
		}))
		
		this.handleRequest('FIN_REQUEST_MUTATE_ITEM', bind(this, function(mutation){
			this.server.mutateItem(mutation, this)
		}))
		
		this.handleRequest('FIN_REQUEST_EXTEND_LIST', bind(this, function(request) {
			var key = request.key,
				from = request.from,
				to = request.to
			
			this.server.getListItems(key, from, to, bind(this, function(items) {
				var response = { _requestId: request._requestId, data: items }
				this.sendFrame('FIN_RESPONSE', response)
			}))
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
