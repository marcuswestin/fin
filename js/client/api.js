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
	this.create = function(properties, callback) {
		if (typeof callback != 'function') { throw logger.error('Second argument to fin.create should be a callback') }
		for (var key in properties) {
			if (properties[key] instanceof Array && !properties[key].length) {
				delete properties[key] // For now we assume that engines treat NULL values as empty lists, a la redis
			}
		}
		this.requestResponse('FIN_REQUEST_CREATE_ITEM', { data: properties }, callback)
	}

	/*
	 * Observe an item property, and get notified any time it changes.
	 * The item property may be chained (e.g. observe(1, 'driver.car.model')),
	 *  assuming that driver.car will resolve to an item ID
	 */
	this.observe = function(itemID, propName, callback) {
		if (!itemID || !propName || !callback) { logger.error("observe requires three arguments", itemId, propName, callback); }
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
	 * Query fin for items matching a set of properties, and get notified
	 * any time an item enters or leaves the matching set
	 */
	this.query = function(query, callback) {
		logger.error("query no longer supported, since there's no straight forward good implementation of them")
		// if (!query || !callback) { logger.error("query requires two arguments", query, callback) }
		// 
		// var queryJSON = JSON.stringify(query),
		// 	key = shared.keys.getQueryKey(queryJSON),
		// 	subId = this._observe({ key: key, type: 'SET' }, callback)
		// 
		// if (this._subscriptionPool.count(key) == 1) {
		// 	this.send('FIN_REQUEST_MONITOR_QUERY', queryJSON)
		// }
		// 
		// return subId
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
				delete this._mutationCache[key]
				delete this._listLength[key]
			}
			
			delete this._subIdToKey[subId]
			if (this._chainDependants[subId]) {
				this.release(this._chainDependants[subId])
				delete this._chainDependants[subId]
			}
		} else { // it's a fin template element
			// TODO Remove this
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
		if (!id || !prop) { logger.error("extendList requires two arguments", itemID, prop) }
		
		this._resolvePropertyChain(id, prop, bind(this, function(resolved) {
			var itemID = this._getItemID(resolved.id),
				listKey = shared.keys.getItemPropertyKey(itemID, resolved.property),
				listLength = this._listLength[listKey] || 0

			if (extendToIndex <= listLength) { return }
			this._listLength[listKey] = extendToIndex

			var args = { key: listKey, from: listLength }
			if (extendToIndex) { args.to = extendToIndex }
			this.requestResponse('FIN_REQUEST_EXTEND_LIST', args, bind(this, function(items) {
				var mutation = { id: listKey, op: 'push', args: items, index: listLength }
				this._handleMutation(mutation)
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
			key = shared.keys.getItemPropertyKey(itemID, params.property),
			subId = pool.add(key, callback),
			type = params.type || 'BYTES',
			cachedMutation = this._mutationCache[key]
		
		if (itemID == this._localID && !cachedMutation) {
			cachedMutation = this._getNullMutation(type)
		}
		
		if (itemID != this._localID && pool.count(key) == 1) {
			if (typeof itemID != 'number') { throw new Error('Expected numeric ID but got "'+itemID+'"') }
			var netParams = { key: key, type: type }
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
		var propertyChain = prop.split('.')
		propertyChain.pop() // for foo.bar.cat, we're trying to resolve the item ID of foo.bar
		if (!propertyChain.length) {
			callback(this._resolveCachedPropertyChain(id, prop))
		} else {
			var subID = this._observeChain(id, propertyChain, 0, bind(this, function() {
				callback(this._resolveCachedPropertyChain(id, prop))
				this.release(subID)
			}), {})
		}
	}
	
	this._resolveCachedPropertyChain = function(id, prop) {
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
		
		var mutation = {
			op: op,
			args: args,
			prop: resolved.property,
			id: shared.keys.getItemPropertyKey(itemID, resolved.property) // this should be called key
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
