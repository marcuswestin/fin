var keys = require('./keys'),
	Pool = require('./client/Pool'),
	slice = require('std/slice'),
	bind = require('std/bind'),
	each = require('std/each'),
	MutationCache = require('./client/MutationCache'),
	Class = require('std/Class'),
	Publisher = require('std/Publisher'),
	unique = require('std/unique')

require('socket.io/node_modules/socket.io-client/dist/socket.io') // exposes "io" globally

// Create fin in the global namespace

var FinAPI = Class(Publisher, function() {
	
	this.init = function() {
		Publisher.prototype.init.apply(this)
		this._requestCallbacks = {}
		this._transactions = {}
		this._transactionStack = []
		this._mutationCache = new MutationCache(this)
		this.subscribe('Message:mutation', bind(this, this._onMutationMessage))
	}
	
/**********************************
 * The core API: connect, create, *
 * observe, set & release  *
 **********************************/
	/* Connect to the fin database. The callback will be called
	 * once you have a connection with the server */
	this.connect = function(callback) {
		if (this._socket) { error("fin.connect has already been called") }
		this.subscribe('Online', callback)
		this._doConnect()
	}
	
	/* Create an item with the given data as properties,
	 * and get notified of the new item id when it's been created */
	this.create = function(properties, callback) {
		if (typeof callback != 'function') { error('Second argument to fin.create should be a callback') }
		for (var key in properties) {
			if (properties[key] instanceof Array && !properties[key].length) {
				delete properties[key] // For now we assume that engines treat NULL values as empty lists, a la redis
			}
		}
		this.requestResponse('create', { data:properties }, callback)
	}

	/* Observe an item property, and get notified any time it changes.
	 * The item property may be chained (e.g. observe(1, 'driver.car.model')),
	 *  assuming that driver.car will resolve to an item ID */
	this.observe = function(itemID, propName, callback) {
		if (typeof itemID != 'number' || !propName || !callback) { error('observe requires three arguments: '+[itemID, propName, callback?'function':callback].join(' ')) }
		return this._observeChain(itemID, propName, 0, callback, {})
	}
	
	/* Mutate a fin item with the given operation */
	this.set = function(itemID, propName, value) {
		this._mutate('set', itemID, propName, [value])
	}
	
	/* Release an observation */
	this.release = function(subId) {
		var key = this._subIdToKey[subId],
			keyInfo = keys.getKeyInfo(key),
			itemID = keyInfo.id
		
		this._subscriptionPool.remove(key, subId)
		
		if (this._subscriptionPool.count(key) == 0) {
			if (itemID != this._localID) {
				this.request('unsubscribe', { id:itemID, property:keyInfo.property })
			}
			this._mutationCache.remove(key)
			delete this._listLength[key]
		}
		
		delete this._subIdToKey[subId]
		if (this._chainDependants[subId]) {
			this.release(this._chainDependants[subId])
			delete this._chainDependants[subId]
		}
	}
	
	/* Get the last cached mutation of a currently observed item property */
	this.getCachedMutation = function(itemName, propName) {
		var itemID = this._getItemID(itemName),
			key = keys.getItemPropertyKey(itemID, propName)
		
		return this._mutationCache.get(key)
	}
	
/***********
 * Set API *
 ***********/
	/* Observe a set of values */
	this.observeSet = function(itemName, propName, callback) {
		this._observe({ id: itemName, property: propName, type: 'SET' }, callback)
	}
	/* Add a value to a set */
	this.addToSet = function(itemName, propName, member) {
		this._mutate('sadd', itemName, propName, [member])
	}
	/* Remove a value from a set */
	this.removeFromSet = function(itemName, propName, member) {
		this._mutate('srem', itemName, propName, [member])
	}

/************
 * List API *
 ************/
	/* Observe an item property list, and get notified any time it changes */
	this.observeList = function(itemID, propName, callback, length) {
		if (typeof itemID != 'number' || !propName || !callback) { error('observe requires at least three arguments: '+[itemName, propName, callback?'function':callback, length].join(' ')) }
		if (!length) { length = 100 }
		
		var subId = this._observeChain(itemID, propName, 0, callback, { snapshot: false })
		
		this.extendList(itemID, propName, length)
		return subId
	}
	
	/* Extend the history of an observed list */
	this._listLength = {}
	this.extendList = function(id, prop, extendToIndex) {
		if (typeof id != 'number' || !prop) { error('extendList requires a numeric ID and a property: '+[itemID, prop].join(' ')) }
		
		this._resolvePropertyChain(id, prop, bind(this, function(resolved) {
			var itemID = this._getItemID(resolved.id),
				property = resolved.property,
				listKey = keys.getItemPropertyKey(itemID, property),
				listLength = this._listLength[listKey] || 0

			if (extendToIndex <= listLength) { return }
			this._listLength[listKey] = extendToIndex

			var extendArgs = { id:itemID, property:property, from:listLength }
			if (extendToIndex) { extendArgs.to = extendToIndex }
			this.requestResponse('extend_list', extendArgs, bind(this, function(items) {
				// For now, we clear the list of cached items such that we don't get duplicates in the list
				var clearMutation = { id:itemID, property:property, op:'clear' }
				this._handleMutation(clearMutation)
				
				var mockMutation = { id: itemID, property: property, op: 'push', args: items, index: listLength }
				this._handleMutation(mockMutation)
			}))
		}))
	}
	/* Add a value onto the end of a list */
	this.push = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'push', values)
	}
	/* Add a value at the beginning of a list */
	this.unshift = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'unshift', values)
	}
	
/********************
 * Miscelaneous API *
 ********************/
	/* Make a custom request to the server */
	this.request = function(request, args, transactionSensitive) {
		args = args || {}
		args.request = request
		this._send(args, transactionSensitive)
	}
	
	/* Make a custom request to the server that expects an explicit response in the callback */
	this.requestResponse = function(request, args, callback, transactionSensitive) {
		var requestId = this._scheduleCallback(callback)
		args.request = request
		args._requestId = requestId
		this._send(args, transactionSensitive)
	}
	
	this._send = function(args, transactionSensitive) {
		var currentTransactionID = this._transactionStack[this._transactionStack.length - 1]
		if (currentTransactionID && transactionSensitive) {
			this._transactions[currentTransactionID].actions.push(args)
			return
		}
		this._socket.json.send(args)
	}
	
	/*
	 * Make a transaction of multiple mutations; either
	 * all or none of the mutations will happen
	 */
	this.transact = function(transactionFn) {
		var id = 't' + this._uniqueRequestId++
		this._transactions[id] = { waitingFor:1, actions:[] }
		this._transactionStack.push(id)
		transactionFn(id)
		this._endTransaction(id)
	}
	
	this._endTransaction = function(transactionID) {
		var id = this._transactionStack.pop()
		if (id != transactionID) { error('transaction ID mismatch in _endTransaction! '+id+' '+transactionID) }
		if (--this._transactions[id].waitingFor) { return }
		this.request('transact', { actions: this._transactions[id].actions })
		delete this._transactions[id]
	}
	
	var emptyTransactionHold = { resume:function(){}, complete:function(){} }
	this._holdTransaction = function() {
		var transactionID = this._transactionStack[this._transactionStack.length - 1]
		if (!transactionID) { return emptyTransactionHold }
		
		this._transactions[transactionID].waitingFor++
		
		var resume = function() { fin._transactionStack.push(transactionID) }
		var complete = function() { fin._endTransaction(transactionID) }
		
		return {
			resume: resume,
			complete: complete
		}
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
	
	/* Get approximately the current server time */
	// TODO The timestamp should be offset by a time given by the server
	this.now = function() { return new Date().getTime() }
	
/* Private APIs
 **************/

	/* Connection management
	 ***********************/
	this._doConnect = function() {
		this._socket = io.connect(location.protocol + '//' + location.hostname + ':' + location.port, {
			'connect timeout':3000,
			// 'try multiple transports', 'reconnection delay', 'max reconnection attempts', port: port,
			// transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'] // Since websockets aren't supported x-domain, and flash sucks
		})

		this._socket
			.on('message', bind(this, this._handleMessage))
			.on('error', bind(this, this._onSocketError))
			.on('connecting', bind(this, this._onSocketConnecting))
			.on('connect', bind(this, this._onSocketConnect))
			.on('connect_failed', bind(this, this._onSocketConnectFailed))
			.on('disconnect', bind(this, this._onSocketDisconnect))
			.on('reconnecting', bind(this, this._onSocketReconnecting))
			.on('reconnect', bind(this, this._onSocketReconnect))
			.on('reconnectFailed', bind(this, this._onSocketReconnectFailed))
	}
	
	this._onSocketConnecting = function() { this._logPublish('Connecting') }
	this._onSocketConnect = function() { this._logPublish('Online') }
	this._onSocketConnectFailed = function() { this._logPublish('Offline') }
	
	this._onSocketDisconnect = function() { this._logPublish('Offline') }
	
	this._onSocketReconnecting = function() { this._logPublish('Connecting') }
	this._onSocketReconnect = function() { this._logPublish('Online') }
	this._onSocketReconnectFailed = function() { this._logPublish('Offline') }
	
	this._logPublish = function(event) {
		console.log('Log', event)
		this._publish(event)
	}
	
	/* Private stuff
	 ***************/
	this._onMutationMessage = function(data) {
		var mutation = JSON.parse(data)
		this._handleMutation(mutation)
	}
	
	this._handleMessage = function(message) {
		if (message.response) { this._executeCallback(message.response, message.data) }
		else { this._publish('Message:'+message.event, message.data) }
	}
	
	this._listOp = function(itemId, propName, op, values) {
		this._mutate(op, itemId, propName, values)
	}
	
	// Observe a chain of item properties, e.g. observe(1, 'driver.car.model')
	this._chainDependants = {}
	this._observeChain = function(itemID, property, index, callback, observeArgs) {
		var propertyChain = (typeof property == 'string' ? property.split('.') : property),
			property = propertyChain[index],
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
	
	this._getItemID = function(itemName) {
		return itemName == 'LOCAL' ? this._localID
				: itemName == 'GLOBAL' ? this._globalID
				: itemName
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
			cachedMutation = this._mutationCache.get(key)
		
		if (itemID == this._localID && !cachedMutation) {
			cachedMutation = this._getNullMutation(type)
		}
		
		if (itemID != this._localID && pool.count(key) == 1) {
			if (typeof itemID != 'number') { error('Expected numeric ID but got: '+itemID) }
			var request = { id:itemID, property:property, type:type }
			if (typeof params.snapshot != 'undefined') {
				request.snapshot = params.snapshot
			}
			this.request('observe', request)
		}
		
		if (cachedMutation && params.useCache !== false) {
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
	
	this._resolvePropertyChain = function(id, property, callback) {
		var propertyChain = this._getPropertyChainCopy(property)
		propertyChain.pop() // for foo.bar.cat, we're trying to resolve the item ID of foo.bar
		if (!propertyChain.length) {
			callback(this._resolveCachedPropertyChain(id, property))
		} else {
			var subID = this._observeChain(id, propertyChain, 0, bind(this, function() {
				callback(this._resolveCachedPropertyChain(id, property))
				// observeChain can yielf synchronously - ensure subID has been assigned
				setTimeout(bind(this, function() { this.release(subID) }), 0)
			}), {})
		}
	}
	
	this._resolveCachedPropertyChain = function(id, property) {
		var propertyChain = this._getPropertyChainCopy(property)
		while (propertyChain.length > 1) {
			id = this.getCachedMutation(id, propertyChain.shift()).value
		}
		return { id: id, property: propertyChain[0] }
	}
	
	this._getPropertyChainCopy = function(property) {
		// TODO Do we need a _getItemID here?
		return (typeof property == 'string' ? property.split('.') : slice(property, 0))
	}
	
	this._localID = -1
	this._globalID = 0
	this._mutate = function(op, id, prop, args) {
		var resolved = this._resolveCachedPropertyChain(id, prop),
			itemID = this._getItemID(resolved.id)
		
		var mutation = {
			op: op,
			args: args,
			id: itemID,
			property: resolved.property
		}
		
		if (itemID != this._localID) { this.request('mutate', { mutation:mutation }, true) }
		
		this._handleMutation(mutation)
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
				if (args.length) { error('Argument for operation without signature: '+operation) }
				break
			case 'add':
			case 'subtract':
				if (args.length != 1) { error('Missing argument for: '+operation) }
				break
			case 'clear':
				break
			default: error('Unknown operation for deserialization: '+operation)
		}
	}
	
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
			mutationCache.set(key, mutation)
			return mutation
		}
		
		switch(mutation.op) {
			case 'set':
				mutationCache.set(key, mutation)
				break
			case 'push':
				cachedMutation.args = cachedMutation.args.concat(mutation.args)
				break
			case 'unshift':
				cachedMutation.args = mutation.args.concat(cachedMutation.args)
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
				error('Unknown operation for caching: '+mutation.op)
		}
		mutationCache.set(key, cachedMutation)
		return cachedMutation
	}
	
	/* Request/Response
	 ******************/
	this._scheduleCallback = function(callback) {
		var requestId = unique('r')
		this._requestCallbacks[requestId] = callback
		return requestId
	}
	
	this._executeCallback = function(requestId, response) {
		var callback = this._requestCallbacks[requestId]
		delete this._requestCallbacks[requestId]
		callback(response)
	}
	
	/* Misc
	 ******/
	function error(message) {
		console.log('fin error:', message)
	}
})

fin = module.exports = new FinAPI()