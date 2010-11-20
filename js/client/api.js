jsio('from shared.javascript import Singleton, bind, forEach')

jsio('import shared.Pool')
jsio('import shared.keys')

jsio('import client.Client')
jsio('import client.TemplateFactory')
jsio('import client.ViewFactory')

// expose fin to global namespace
fin = Singleton(function(){

/**********************************
 * The core API: connect, create, *
 * observe, set, query & release  *
 **********************************/
	/*
	 * Connect to the fin database. The callback will be called
	 * once you're connected with the server
	 */
	this.connect = function(callback) {
		this._client.connect(callback)
	}
	
	/* 
	 * Create an item with the given data as properties, 
	 * and get notified of the new item id when it's been created
	 */
	this.create = function(data, callback) {
		if (typeof callback != 'function') { throw logger.error('Second argument to fin.create should be a callback') }
		this.requestResponse('FIN_REQUEST_CREATE_ITEM', { data: data }, callback)
	}

	/*
	 * Observe an item property, and get notified any time it changes
	 */
	this.observe = function(itemId, propName, callback) {
		if (!itemId || !propName || !callback) { logger.error("observe requires three arguments", itemId, propName, callback); }
		
		return this._observe({ id: itemId, property: propName }, callback)
	}
	
	/*
	 * Mutate a fin item with the given operation
	 */
	this.set = function(itemID, propName, value) {
		this.mutate('set', itemID, propName, [value])
	}
	
	/*
	 * Query fin for items matching a set of properties, and get notified
	 * any time an item enters or leaves the matching set
	 */
	this.query = function(query, callback) {
		if (!query || !callback) { logger.error("query requires two arguments", query, callback) }
		
		var queryJSON = JSON.stringify(query),
			key = shared.keys.getQueryKey(queryJSON),
			subId = this._observe({ key: key, type: 'SET' }, callback)
		
		if (this._subscriptionPool.count(key) == 1) {
			this.send('FIN_REQUEST_MONITOR_QUERY', queryJSON)
		}
		
		return subId
	}
	
	/* 
	 * Release an observation or query
	 */
	this.release = function(subId) {
		if (typeof subId == 'string') {
			var key = this._subIdToKey[subId],
				keyInfo = shared.keys.getKeyInfo(key),
				itemID = keyInfo.id
			
			this._subscriptionPool.remove(key, subId)
			
			if (this._subscriptionPool.count(key) == 0) {
				if (itemID != this._localID) {
					this.send('FIN_REQUEST_UNSUBSCRIBE', key)
				}
				delete this._listLength[key]
			}
			
			delete this._subIdToKey[subId]
		} else { // it's a fin template element
			this._templateFactory.releaseTemplate(subId)
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
			key = shared.keys.getItemPropertyKey(itemID, propName)
		
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
		if (!itemName || !propName || !callback) { logger.error("observe requires at least three arguments", itemName, propName, callback, length) }
		
		var subId = this._observe({ id: itemName, property: propName, snapshot: false }, callback)
		this.extendList(itemName, propName, length)
		return subId
	}
	
	/*
	 * Extend the history of an observed list
	 */
	this._listLength = {}
	this.extendList = function(itemName, propName, extendToIndex) {
		if (!itemName || !propName) { logger.error("extendList requires two arguments", itemName, propName) }
		
		var itemID = this._getItemID(itemName),
			listKey = shared.keys.getItemPropertyKey(itemID, propName),
			listLength = this._listLength[listKey] || 0
		
		if (extendToIndex <= listLength) { return }
		this._listLength[listKey] = extendToIndex
		
		var args = { key: listKey, from: listLength }
		if (extendToIndex) { args.to = extendToIndex }
		this.requestResponse('FIN_REQUEST_EXTEND_LIST', args, bind(this, function(items) {
			var mutation = { id: listKey, op: 'push', args: items, index: listLength }
			this._handleMutation(mutation)
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
	this.requestResponse = function(frameName, args, callback) {
		var requestId = this._scheduleCallback(callback)
		args._requestId = requestId
		this.send(frameName, args)
	}
	
	/* 
	 * Send a frame to the server
	 */
	this.send = function(frameName, args) {
		this._client.sendFrame(frameName, args)
	}
	
	/*
	 * Register a handler for a type of event from the server
	 */
	this.registerEventHandler = function(frameName, callback) {
		this._client.registerEventHandler(frameName, callback)
	}
	
	/* 
	 * Focus an item property for editing. Any other focused client gets blurred.
	 * When another client requests focus, onBlurCallback gets called
	 */
	this.focus = function(itemId, propName, onBlurCallback) {
		var sessionId = this._client.getSessionID(),
			focusProp = shared.keys.getFocusProperty(propName),
			sendFocusInfo = { session: sessionId, user: gUserId, time: fin.now() },
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
	
	/*
	 * Generate a unique ID
	 */
	var _unique = 1
	this.unique = function() { return 'fan_u' + _unique++ }
	
	/*
	 * Apply a template to a fin item (or multiple items)
	 */
	this.applyTemplate = function(templateString, itemIds) {
		return this._templateFactory.applyTemplate(templateString, itemIds)
	}
	
	/*
	 * Create a view directly, and get a reference to the javascript object. Make sure you release it correctly!
	 */
	this.createView = function(viewName) {
		var args = Array.prototype.slice.call(arguments, 1)
		return this._viewFactory.createView(viewName, args)
	}
	
	/*
	 * Register a template view
	 */
	this.registerView = function(viewName, viewCtor) {
		this._viewFactory.registerView(viewName, viewCtor)
	}

/*******************
 * Private methods *
 *******************/
	this.init = function() {
		this._requestCallbacks = {}
		
		this._viewFactory = new client.ViewFactory()
		this._templateFactory = new client.TemplateFactory(this._viewFactory)
		
		this._client = new client.Client()
		
		this._client.registerEventHandler('FIN_RESPONSE', bind(this, function(response) {
			logger.info('FIN_RESPONSE', response._requestId, response.data)
			this._executeCallback(response._requestId, response.data)
		}))
		
		this._client.registerEventHandler('FIN_EVENT_MUTATION', bind(this, function(mutationJSON) {
			var mutation = JSON.parse(mutationJSON)
			logger.info('FIN_EVENT_MUTATION', mutation)
			this._handleMutation(mutation)
		}))
	}
	
	this._subIdToKey = {}
	this._subscriptionPool = new shared.Pool()
	this._observe = function(params, callback) {
		var itemID = this._getItemID(params.id)
			pool = this._subscriptionPool,
			key = params.key || shared.keys.getItemPropertyKey(itemID, params.property),
			subId = pool.add(key, callback),
			cachedMutation = this._mutationCache[key]
		
		if (itemID != this._localID && pool.count(key) == 1) {
			var netParams = { key: key, type: (params.type || 'BYTES') }
			if (typeof params.snapshot != 'undefined') {
				netParams.snapshot = params.snapshot
			}
			this.send('FIN_REQUEST_OBSERVE', netParams)
		} else if (cachedMutation && params.useCache !== false) {
			this._handleMutation(cachedMutation, callback)
		}
		
		this._subIdToKey[subId] = key
		return subId
	}
		
	this._localID = '__fin_local'
	this._globalID = 0
	this.mutate = function(op, id, prop, args) {
		var itemID = this._getItemID(id)
		var mutation = {
			op: op,
			args: args,
			prop: prop,
			id: shared.keys.getItemPropertyKey(itemID, prop) // this should be called key
		}
		
		if (itemID != this._localID) { this.send('FIN_REQUEST_MUTATE', mutation) }
		
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
				if (args.length) { throw logger.error("Argument for operation without signature " + operation) }
				break
			case 'add':
			case 'subtract':
				if (args.length != 1) { throw logger.error('Missing argument for "'+operation+'"') }
				break
			default: throw logger.error("Unknown operation for deserialization " + operation)
		}
	}
	
	this._mutationCache = {}
	this._handleMutation = function(mutation, singleCallback) {
		if (singleCallback) {
			var args = [mutation.op].concat(mutation.args)
			setTimeout(function() { singleCallback(mutation, mutation.value) })
		} else {
			var key = mutation.id,
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
				throw logger.error('Unknown operation for caching "'+mutation.op+'"')
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
})
