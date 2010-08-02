jsio('from shared.javascript import Singleton, bind')

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
		this._connect(callback)
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
	this.set = function(itemId, propName, value) {
		if (arguments.length == 2) {
			var properties = propName
			for (var propName in properties) {
				this.set(itemId, propName, properties[propName])
			}
			return
		}
		
		var key = shared.keys.getItemPropertyKey(itemId, propName)
		this._mutate({ key: key, op: 'set', args: [JSON.stringify(value)] })
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
	this.release = function(subId, options) {
		options = options || {}
		
		if (typeof subId == 'string') {
			var channel = this._subIdToChannel[subId]
			this._subscriptionPool.remove(channel, subId)
			
			if (this._subscriptionPool.count(channel) == 0) {
				if (options.local !== true) {
					this.send('FIN_REQUEST_UNSUBSCRIBE', channel)
				}
				delete this._listLength[channel]
			}

			delete this._subIdToChannel[subId]
		} else { // it's a fin template element
			this._templateFactory.releaseTemplate(subId)
		}
	}
	
/**********************
 * Local property API *
 **********************/
	/*
	 * Observe a local property. This does not get synched across clients or page views
	 */
	this._localId = '__fin_local'
	this.observeLocal = function(propName, callback) {
		if (!propName || !callback) { logger.error("observeLocal requires two arguments", propName, callback); }
		
		return this._observe({ id: this._localId, property: propName, local: true }, callback)
	}

	/*
	 * Mutate a local property. This does not get synched across clients or page views
	 */
	this.setLocal = function(propName, value) {
		this._mutate({ locals: true, id: this._localId, op: 'set', prop: propName, args: [JSON.stringify(value)] })
	}
	
	/*
	 * Release a local observation
	 */
	this.releaseLocal = function(subId) {
		this.release(subId, { local: true })
	}

/***********
 * Set API *
 ***********/
	this.observeSet = function(itemId, propName, callback) {
		this._observe({ id: itemId, property: propName, type: 'SET' }, callback)
	}

	this.addToSet = function(itemId, propName, member) {
		this._mutate({ id: itemId, op: 'sadd', prop: propName, args: [JSON.stringify(member)] })
	}

	this.removeFromSet = function(itemId, propName, member) {
		this._mutate({ id: itemId, op: 'srem', prop: propName, args: [JSON.stringify(member)] })
	}

/************
 * List API *
 ************/
	/* 
	 * Observe an item property list, and get notified any time it changes
	 */
	this.observeList = function(itemId, propName, callback, length) {
		if (!itemId || !propName || !callback) { logger.error("observe requires at least three arguments", itemId, propName, callback, length); }
		
		var subId = this._observe({ id: itemId, property: propName, snapshot: false }, callback)
		this.extendList(itemId, propName, length || 10)
		return subId
	}
	
	/*
	 * Extend the history of an observed list
	 */
	this._listLength = {}
	this.extendList = function(itemId, propName, maxLen) {
		if (!itemId || !propName || !maxLen) { logger.error("extendList requires three arguments", itemId, propName, maxLen); }
		
		var listKey = shared.keys.getItemPropertyKey(itemId, propName),
			listLength = this._listLength[listKey] || 0
		
		if (maxLen <= listLength) { return }
		this._listLength[listKey] = maxLen
		
		var args = { key: listKey, from: listLength, to: maxLen }
		this.requestResponse('FIN_REQUEST_EXTEND_LIST', args, bind(this, function(items) {
			var mutation = { id: listKey, op: 'listAppend', args: items, index: listLength }
			this._handleMutation(mutation)
		}))
	}
	
	this.appendToList = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'listAppend', values)
	}
	
	this.prependToList = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		this._listOp(itemId, propName, 'listPrepend', values)
	}
	
	this._listOp = function(itemId, propName, op, values) {
		for (var i=0; i < values.length; i++) {
			values[i] = JSON.stringify(values[i])
		}
		this._mutate({ id: itemId, op: op, prop: propName, args: values })
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
		var sessionId = this._sessionId,
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
	
	this._connect = function(callback) {
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
		// TODO Get the session key from the server
		this._sessionId = 'fin_random_session_' + Math.floor(Math.random() * 100000)
	}
	
	this._subIdToChannel = {}
	this._subscriptionPool = new shared.Pool()
	this._observe = function(params, callback) {
		var itemId = params.id,
			propName = params.property,
			isGlobal = (params.local != true),
			pool = this._subscriptionPool,
			key = params.key || shared.keys.getItemPropertyKey(itemId, propName)
		
		var subId = pool.add(key, callback),
			cachedMutation = this._mutationCache[key]
		
		if (isGlobal && pool.count(key) == 1) {
			var netParams = { key: key, type: (params.type || 'BYTES') }
			if (typeof params.snapshot != 'undefined') {
				netParams.snapshot = params.snapshot
			}
			this.send('FIN_REQUEST_OBSERVE', netParams)
		} else if (cachedMutation && params.useCache !== false) {
			this._handleMutation(cachedMutation, callback)
		}
		
		this._subIdToChannel[subId] = key
		return subId
	}
		
	this._mutate = function(params) {
		var mutation = {
			id: params.key || shared.keys.getItemPropertyKey(params.id, params.prop),
			op: params.op,
			args: params.args
		}
		if (params.local !== true) {
			this.send('FIN_REQUEST_MUTATE', mutation)
		}
		this._handleMutation(mutation)
	}
	
	this._deserializeMutation = function(mutation) {
		var args = mutation.args,
			operation = mutation.op
		switch(operation) {
			case 'set':
				mutation.value = args[0] = JSON.parse(args[0])
				break
			case 'listAppend':
			case 'listPrepend':
			case 'sadd':
			case 'srem':
				for (var i=0; i < args.length; i++) { args[i] = JSON.parse(args[i]) }
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
			cachedArgs = cachedMutation && cachedMutation.args
		
		if (!cachedMutation) {
			return mutationCache[key] = mutation
		}
		
		switch(mutation.op) {
			case 'set':
				mutationCache[key] = mutation
				break
			case 'listAppend':
				cachedArgs = cachedArgs.concat(mutation.args)
				break
			case 'listPrepend':
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
			default:
				throw logger.error("Unknown operation for caching "+ operation)
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
