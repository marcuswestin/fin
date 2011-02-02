var util = require('./js/shared/util'),
	Pool = require('./js/shared/Pool'),
	keys = require('./js/shared/keys')

// socket.io expects the request for the js file to come in at root
//  level, and puts the io object in the global scope
require('/socket.io/socket.io')

// aliases
var bind = util.bind,
	forEach = util.forEach

var debug = true,
	log = debug ? function() { console.log.apply(console, arguments) } : function(){}

var fin = module.exports = new (function(){

/**********************************
 * The core API: connect, create, *
 * observe, set & release  *
 **********************************/
	/*
	 * Connect to the fin database. The callback will be called
	 * once you're connected with the server
	 */
	this.connect = function(callback) {
		if (this._socket.connected) {
			if (callback) { callback() }
			return
		}
		if (callback) {
			this._connectCallbacks.push(callback)
		}
		if (!this._socket.connecting) {
			this._socket.connect()
		}
	}
	
	/* 
	 * Create an item with the given data as properties, 
	 * and get notified of the new item id when it's been created
	 */
	this.create = function(properties, callback) {
		if (typeof callback != 'function') { throw log('Second argument to fin.create should be a callback') }
		for (var key in properties) {
			if (properties[key] instanceof Array && !properties[key].length) {
				delete properties[key] // For now we assume that engines treat NULL values as empty lists, a la redis
			}
		}
		this.requestResponse({ request:'create', data:properties }, callback)
	}

	/*
	 * Observe an item property, and get notified any time it changes.
	 * The item property may be chained (e.g. observe(1, 'driver.car.model')),
	 *  assuming that driver.car will resolve to an item ID
	 */
	this.observe = function(itemID, propName, callback) {
		if (!itemID || !propName || !callback) { log("observe requires three arguments", itemId, propName, callback); }
		var propertyChain = propName.split('.')
		return this._observeChain(itemID, propertyChain, 0, callback, {})
	}
	
	/*
	 * Observe a chain of item properties, e.g. observe(1, 'driver.car.model')
	 */
	this._chainDependants = {}
	this._observeChain = function(itemID, propertyChain, index, callback, observeArgs) {
		var property = propertyChain[index],
			subID, dependantSubID, lastSubItemID
		
		if (index == propertyChain.length - 1) {
			observeArgs.id = itemID
			observeArgs.property = property
			return this._observe(observeArgs, callback)
		} else {
			return subID = this._observe({ id: itemID, property: property }, bind(this, function(mutation, subItemID) {
				if (subItemID == lastSubItemID) { return }
				lastSubItemID = subItemID
				if (dependantSubID) { this.release(dependantSubID) }
				dependantSubID = this._observeChain(subItemID, propertyChain, index + 1, callback, observeArgs)
				this._chainDependants[subID] = dependantSubID
			}))
		}
	}
	
	/*
	 * Mutate a fin item with the given operation
	 */
	this.set = function(itemID, propName, value) {
		this.mutate('set', itemID, propName, [value])
	}
	
	/* 
	 * Release an observation
	 */
	this.release = function(subId) {
		var key = this._subIdToKey[subId],
			keyInfo = keys.getKeyInfo(key),
			itemID = keyInfo.id
		
		this._subscriptionPool.remove(key, subId)
		
		if (this._subscriptionPool.count(key) == 0) {
			if (itemID != this._localID) {
				this._socket.send({ request:'unsubscribe', id:itemID, property:keyInfo.property })
			}
			delete this._mutationCache[key]
			delete this._listLength[key]
		}
		
		delete this._subIdToKey[subId]
		if (this._chainDependants[subId]) {
			this.release(this._chainDependants[subId])
			delete this._chainDependants[subId]
		}
	}
	
	this._getItemID = function(itemName) {
		return itemName == 'LOCAL' ? this._localID
				: itemName == 'GLOBAL' ? this._globalID
				: itemName
	}
	
	/*
	 * Get the last cached mutation of a currently observed item property
	 */
	this.getCachedMutation = function(itemName, propName) {
		var itemID = this._getItemID(itemName),
			key = keys.getItemPropertyKey(itemID, propName)
		
		return this._mutationCache[key]
	}

/***********
 * Set API *
 ***********/
	this.observeSet = function(itemName, propName, callback) {
		this._observe({ id: itemName, property: propName, type: 'SET' }, callback)
	}

	this.addToSet = function(itemName, propName, member) {
		this.mutate('sadd', itemName, propName, [member])
	}

	this.removeFromSet = function(itemName, propName, member) {
		this.mutate('srem', itemName, propName, [member])
	}

/************
 * List API *
 ************/
	/* 
	 * Observe an item property list, and get notified any time it changes
	 */
	this.observeList = function(itemName, propName, callback, length) {
		if (!itemName || !propName || !callback) { log("observe requires at least three arguments", itemName, propName, callback, length) }
		
		var propertyChain = propName.split('.'),
			subId = this._observeChain(itemName, propertyChain, 0, callback, { snapshot: false })
		
		this.extendList(itemName, propName, length)
		return subId
	}
	
	/*
	 * Extend the history of an observed list
	 */
	this._listLength = {}
	this.extendList = function(id, prop, extendToIndex) {
		if (!id || !prop) { log("extendList requires two arguments", itemID, prop) }
		
		this._resolvePropertyChain(id, prop, bind(this, function(resolved) {
			var itemID = this._getItemID(resolved.id),
				property = resolved.property,
				listKey = keys.getItemPropertyKey(itemID, property),
				listLength = this._listLength[listKey] || 0

			if (extendToIndex <= listLength) { return }
			this._listLength[listKey] = extendToIndex

			var extendArgs = { request:'extend_list', id:itemID, property:property, from:listLength }
			if (extendToIndex) { extendArgs.to = extendToIndex }
			this.requestResponse(extendArgs, bind(this, function(items) {
				var mockMutation = { id: itemID, property: property, op: 'push', args: items, index: listLength }
				this._handleMutation(mockMutation)
			}))
		}))
	}
	
	this.append = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'push', values)
	}
	
	this.prepend = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'unshift', values)
	}
	
	this._listOp = function(itemId, propName, op, values) {
		this.mutate(op, itemId, propName, values)
	}
	
/********************
 * Miscelaneous API *
 ********************/
	/* 
	 * Make a request with an associated requestId, 
	 * and call the callback upon response
	 */
	this.requestResponse = function(args, callback) {
		var requestId = this._scheduleCallback(callback)
		args._requestId = requestId
		this._socket.send(args)
	}
	
	/* 
	 * Focus an item property for editing. Any other focused client gets blurred.
	 * When another client requests focus, onBlurCallback gets called
	 */
	this.focus = function(itemId, propName, onBlurCallback) {
		var sessionId = this._client.getSessionID(),
			focusProp = keys.getFocusProperty(propName),
			sendFocusInfo = { session: sessionId, user: gUserId, time: this.now() },
			subId, observation, releaseFn
		
		this.set(itemId, focusProp, JSON.stringify(sendFocusInfo))
		
		observation = { id: itemId, property: focusProp, useCache: false, snapshot: false }
		subId = this._observe(observation, bind(this, function(mutation, focusJSON) {
			if (!subId) { return }
			
			var focusInfo
			try { focusInfo = JSON.parse(focusJSON) }
			catch(e) { } // There are old focus keys sitting around with non JSON values
			
			if (!focusInfo || focusInfo.session == sessionId) { return }
			
			releaseFn()
			onBlurCallback(focusInfo)
		}))
		
		releaseFn = bind(this, function () {
			if (!subId) { return }
			this.release(subId)
			subId = null
			this.set(itemId, focusProp, null)
		})
		
		return releaseFn
	}
	
	/*
	 * Get approximately the current server time
	 */
	// TODO The timestamp should be offset by a time given by the server
	this.now = function() { return new Date().getTime() }
	
/*******************
 * Private methods *
 *******************/
	this._init = function() {
		this._connectCallbacks = []
		this._requestCallbacks = {}
		this._socket = new io.Socket()
		this._socket.on('connect', bind(this, '_handleConnected'))
		this._socket.on('message', bind(this, '_handleMessage'))
		this._socket.on('disconnect', bind(this, '_handleDisconnect'))
	}
	
	this._handleConnected = function() {
		log("Connected!")
		for (var i=0; i<this._connectCallbacks.length; i++) {
			this._connectCallbacks[i]()
		}
		this._connectCallbacks = []
	}
	
	this._handleMessage = function(message) {
		if (message.response) {
			log('handle resonse', message.response)
			this._executeCallback(message.response, message.data)
		} else if (message.event == 'mutation') {
			var mutation = JSON.parse(message.data)
			log('handle mutation', mutation)
			this._handleMutation(mutation)
		} else {
			log('received unknown message', message)
		}
	}
	
	this._handleDisconnect = function() {
		log('_handleDisconnect', arguments)
	}
	
	this._subIdToKey = {}
	this._subscriptionPool = new Pool()
	this._observe = function(params, callback) {
		var itemID = this._getItemID(params.id),
			property = params.property,
			pool = this._subscriptionPool,
			key = keys.getItemPropertyKey(itemID, property),
			subId = pool.add(key, callback),
			type = params.type || 'BYTES',
			cachedMutation = this._mutationCache[key]
		
		if (itemID == this._localID && !cachedMutation) {
			cachedMutation = this._getNullMutation(type)
		}
		
		if (itemID != this._localID && pool.count(key) == 1) {
			if (typeof itemID != 'number') { debugger; throw new Error('Expected numeric ID but got "'+itemID+'"') }
			var request = { request:'observe', id:itemID, property:property, type:type }
			if (typeof params.snapshot != 'undefined') {
				request.snapshot = params.snapshot
			}
			this._socket.send(request)
		} else if (cachedMutation && params.useCache !== false) {
			this._handleMutation(cachedMutation, callback)
		}
		
		this._subIdToKey[subId] = key
		return subId
	}
	
	this._getNullMutation = function(type) {
		var mutation
		switch(type) {
			case 'LIST':
				mutation = { op: 'push', args: [] }
			case 'BYTES': // fall through
			default:
				mutation = { op: 'set', args: [''], value: '' }
		}
		return mutation
	}
	
	this._resolvePropertyChain = function(id, prop, callback) {
		// TODO Do we need a _getItemID here?
		var propertyChain = prop.split('.')
		propertyChain.pop() // for foo.bar.cat, we're trying to resolve the item ID of foo.bar
		if (!propertyChain.length) {
			callback(this._resolveCachedPropertyChain(id, prop))
		} else {
			var subID = this._observeChain(id, propertyChain, 0, bind(this, function() {
				callback(this._resolveCachedPropertyChain(id, prop))
				// observeChain can yielf synchronously - ensure subID has been assigned
				setTimeout(bind(this, function() { this.release(subID) }), 0)
			}), {})
		}
	}
	
	this._resolveCachedPropertyChain = function(id, prop) {
		// TODO Do we need a _getItemID here?
		var propertyChain = prop.split('.')
		while (propertyChain.length > 1) {
			id = this.getCachedMutation(id, propertyChain.shift()).value
		}
		return { id: id, property: propertyChain[0] }
	}
	
	this._localID = '__fin_local'
	this._globalID = 0
	this.mutate = function(op, id, prop, args) {
		var resolved = this._resolveCachedPropertyChain(id, prop),
			itemID = this._getItemID(resolved.id)
		
		var request = {
			request: 'mutate',
			mutation: {
				op: op,
				args: args,
				id: itemID,
				property: resolved.property
			}
		}
		
		if (itemID != this._localID) { this._socket.send(request) }
		
		this._handleMutation(request.mutation)
	}
	
	this._deserializeMutation = function(mutation) {
		var args = mutation.args,
			operation = mutation.op
		switch(operation) {
			case 'set':
				mutation.value = args[0]
				break
			case 'push':
			case 'unshift':
			case 'sadd':
			case 'srem':
				for (var i=0; i < args.length; i++) { args[i] = args[i] }
				break
			case 'increment':
			case 'decrement':
				if (args.length) { throw log("Argument for operation without signature " + operation) }
				break
			case 'add':
			case 'subtract':
				if (args.length != 1) { throw log('Missing argument for "'+operation+'"') }
				break
			default: throw log("Unknown operation for deserialization " + operation)
		}
	}
	
	this._mutationCache = {}
	this._handleMutation = function(mutation, singleCallback) {
		if (singleCallback) {
			var args = [mutation.op].concat(mutation.args)
			singleCallback(mutation, mutation.value)
		} else {
			var key = keys.getItemPropertyKey(mutation.id, mutation.property),
				subs = this._subscriptionPool.get(key)
			
			this._deserializeMutation(mutation)
			this._cacheMutation(mutation, key)
			
			for (var subId in subs) {
				subs[subId](mutation, mutation.value)
			}
		}
	}
	
	this._cacheMutation = function(mutation, key) {
		var mutationCache = this._mutationCache,
			cachedMutation = mutationCache[key],
			cachedArgs = cachedMutation && cachedMutation.args,
			cachedValue = cachedMutation && cachedMutation.value
		
		if (!cachedMutation) {
			return mutationCache[key] = mutation
		}
		
		switch(mutation.op) {
			case 'set':
				mutationCache[key] = mutation
				break
			case 'push':
				cachedArgs = cachedArgs.concat(mutation.args)
				break
			case 'unshift':
				cachedArgs = mutation.args.concat(cachedArgs)
				break
			case 'sadd':
				for (var i=0, itemId; itemId = mutation.args[i]; i++) {
					if (cachedArgs.indexOf(itemId) == -1) { cachedArgs.push(itemId) }
				}
				break
			case 'srem':
				for (var i=0, itemId; itemId = mutation.args[i]; i++) {
					cachedArgs.splice(cachedArgs.indexOf(itemId), 1)
				}
				break
			case 'increment':
				cachedMutation.value = mutation.value = (cachedValue || 0) + 1
				break
			case 'decrement':
				cachedMutation.value = mutation.value = (cachedValue || 0) - 1
				break
			case 'add':
				cachedMutation.value = mutation.value = (cachedValue || 0) + mutation.args[0]
				break
			case 'subtract':
				cachedMutation.value = mutation.value = (cachedValue || 0) - mutation.args[0]
				break
			default:
				throw log('Unknown operation for caching "'+mutation.op+'"')
		}
		return mutationCache[key]
	}
	
	this._uniqueRequestId = 0
	this._scheduleCallback = function(callback) {
		var requestId = 'r' + this._uniqueRequestId++
		this._requestCallbacks[requestId] = callback
		return requestId
	}
	
	this._executeCallback = function(requestId, response) {
		var callback = this._requestCallbacks[requestId]
		delete this._requestCallbacks[requestId]
		callback(response)
	}
	
	this._init()
})()