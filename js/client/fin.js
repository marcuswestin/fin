jsio('from shared.javascript import Singleton, bind')

jsio('import shared.SubscriptionPool')
jsio('import shared.keys')

jsio('import client.Client')

// expose fin to global namespace
fin = Singleton(function(){
	
	// Make sure you have a connection with the server before using fin
	this.connect = function(callback) {
		var transport, connectParams = {}
		switch(jsio.__env.name) {
			case 'node':
				transport = 'tcp'
				connectParams.host = '127.0.0.1'
				connectParams.port = 5556
				connectParams.timeout = 0
				break;
			case 'browser':
				transport = location.hash.match(/fin-postmessage/) ? 'postmessage' : 'csp'
				connectParams.url = 'http://' + (document.domain || '127.0.0.1') + ':5555'
				break;
		}
		this._client.connect(transport, connectParams, callback)
	}
	
	/* 
	 * Create an item with the given data as properties, 
	 * and get notified of the new item id when it's been created
	 */
	this.create = function(data, callback) {
		var requestId = this._scheduleCallback(callback)
		this._client.sendFrame('FIN_REQUEST_CREATE_ITEM', { _requestId: requestId, data: data })
	}
	
	/*
	 * Subscribe to an item property, and get notified any time it changes
	 */
	this._subIdToChannel = {}
	this._subriptionPool = new shared.SubscriptionPool()
	this.subscribe = function(itemId, propName, callback) {
		var channel = shared.keys.getItemPropertyChannel(itemId, propName)
			subId = this._subriptionPool.add(channel, callback)
		
		if (this._subriptionPool.count(channel) == 1) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE', { id: itemId, prop: propName })
		}
		
		this._subIdToChannel[subId] = channel
		return subId
	}
	
	/*
	 * Query fin for items matching a set of properties, and get notified
	 * any time an item enters or leaves the matching set
	 */
	this.query = function() { throw logger.error("Unimplemented method query") }
	
	/*
	 * Monitor any changes to a given property. 
	 * This should probably not be used except by query robot clients
	 */
	this.monitorProperty = function() { throw logger.error("Unimplemented method monitorProperty") }
	
	/* 
	 * Release a subscription, query, or property monitoring
	 */
	this.release = function(subId) {
		var channel = this._subIdToChannel[subId]
		this._subriptionPool.remove(channel)
		
		if (this._subriptionPool.count() == 0) {
			this._client.sendFrame('FIN_REQUEST_UNSUBSCRIBE_ITEM', itemId)
		}
		
		delete this._subIdToChannel[subId]
	}
	
	/*
	 * Mutate a fin item with the given operation
	 */
	this.mutate = function(itemId, operation, propName) {
		var key = shared.keys.getItemPropertyKey(itemId, propName),
			operationArgs = Array.prototype.slice.call(arguments, 3)
		
		operationArgs.unshift(key)
		
		this._client.sendFrame('FIN_REQUEST_MUTATE_ITEM', {
			op: operation,
			args: operationArgs
		})
	}
	
	var uniqueRequestId = 0
	this._scheduleCallback = function(callback) {
		if (!callback) { return }
		var requestId = 'r' + uniqueRequestId++
		this._requestCallbacks[requestId] = callback
		return requestId
	}
	
	this._executeCallback = function(requestId, response) {
		if (!requestId) { return }
		var callback = this._requestCallbacks[requestId]
		delete this._requestCallbacks[requestId]
		callback(response)
	}
	
	// Private method - hook up all internals
	this.init = function() {
		this._requestCallbacks = {}
		
		this._client = new client.Client()
		
		this._client.registerEventHandler('FIN_RESPONSE', bind(this, function(response) {
			this._executeCallback(response._requestId, response.data)
		}))
		
		this._client.registerEventHandler('FIN_EVENT_ITEM_MUTATED', bind(this, function(mutationJSON) {
			var mutation = JSON.parse(mutationJSON),
				keyInfo = shared.keys.getKeyInfo(mutation.args[0])
				channel = shared.keys.getItemPropertyChannel(keyInfo.id, keyInfo.prop)
				subs = this._subriptionPool.get(channel)
			
			for (var subId in subs) {
				// TODO store local values and apply mutations other than just "set"
				subs[subId](mutation, mutation.args[1])
			}
		}))
	}
})
