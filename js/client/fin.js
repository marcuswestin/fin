jsio('from shared.javascript import Singleton, bind')

jsio('import shared.Pool')
jsio('import shared.keys')

jsio('import client.Client')
jsio('import client.TemplateFactory')
jsio('import client.ViewFactory')

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
		// TODO Get the session key from the server
		this._sessionId = 'fin_random_session_' + Math.floor(Math.random() * 100000)
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
	 * Observe an item property, and get notified any time it changes
	 */
	this.observe = function(itemId, propName, callback) {
		if (!itemId || !propName || !callback) { logger.error("observe requires three arguments", itemId, propName, callback); }
		
		return this._observe(itemId, propName, callback)
	}
	
/********************
 * Local properties *
 ********************/

	/*
	 * Observe a local property. This does not get synched across clients or page views
	 */
	this._localId = '__fin_local'
	this.observeLocal = function(propName, callback) {
		if (!propName || !callback) { logger.error("observeLocal requires two arguments", propName, callback); }
		
		return this._observe(this._localId, propName, callback, { mute: true })
	}
	/*
	 * Mutate a local property. This does not get synched across clients or page views
	 */
	this.setLocal = function(propName, value) {
		var params = { id: this._localId, op: 'set', prop: propName, args: [JSON.stringify(value)] }
		
		this._mutate(params, { mute: true })
	}
	
	/* 
	 * Observe an item property list, and get notified any time it changes
	 */
	this.observeList = function(itemId, propName, callback, length) {
		if (!itemId || !propName || !callback) { logger.error("observe requires at least three arguments", itemId, propName, callback, length); }
		
		var subId = this._observe(itemId, propName, callback, { snapshot: false })
		this.extendList(itemId, propName, length || 10)
		return subId
	}
	
	/*
	 * Extend the history of an observed list
	 */
	this._listLength = {}
	this.extendList = function(itemId, propName, maxLen) {
		if (!itemId || !propName || !maxLen) { logger.error("observe requires three arguments", itemId, propName, maxLen); }
		
		var listKey = shared.keys.getItemPropertyKey(itemId, propName),
			listChannel = shared.keys.getItemPropertyChannel(itemId, propName),
			listLength = this._listLength[listChannel] || 0
		
		if (maxLen <= listLength) { return }
		this._listLength[listChannel] = maxLen
		
		var args = { key: listKey, from: listLength, to: maxLen }
		this.requestResponse('FIN_REQUEST_EXTEND_LIST', args, bind(this, function(items) {
			var mutation = { id: itemId, prop: propName, op: 'splice', args: [items], index: listLength }
			this._handleItemMutation(mutation)
		}))
	}
	
	this._subIdToChannel = {}
	this._subscriptionPool = new shared.Pool()
	this._observe = function(itemId, propName, callback, options) {
		options = options || {}
		
		var channel = shared.keys.getItemPropertyChannel(itemId, propName)
			subId = this._subscriptionPool.add(channel, callback),
			cachedMutation = this._mutationCache[channel]
		
		if (this._subscriptionPool.count(channel) == 1 && !options.mute) {
			var params = { id: itemId, prop: propName }
			if (typeof options.snapshot != 'undefined') {
				params.snapshot = options.snapshot
			}
			this.send('FIN_REQUEST_OBSERVE', params)
		} else if (cachedMutation) {
			this._handleItemMutation(cachedMutation, callback)
		}
		
		this._subIdToChannel[subId] = channel
		return subId
		
	}
	
	/*
	 * Query fin for items matching a set of properties, and get notified
	 * any time an item enters or leaves the matching set
	 */
	this.query = function(query, callback) {
		if (!query || !callback) { logger.error("query requires two arguments", query, callback) }
		
		var queryJSON = JSON.stringify(query),
			queryChannel = shared.keys.getQueryChannel(queryJSON),
			subId = this._subscriptionPool.add(queryChannel, callback),
			cachedMutation = this._mutationCache[queryChannel]

		if (this._subscriptionPool.count(queryChannel) == 1) {
			this.send('FIN_REQUEST_QUERY', queryJSON)
		} else if (cachedMutation) {
			this._handleQueryMutation(cachedMutation, callback)
		}
		
		return subId
	}
	
	/* 
	 * Release a subscription, query, or property monitoring
	 */
	this.release = function(subId) {
		if (typeof subId == 'string') {
			var channel = this._subIdToChannel[subId]
			this._subscriptionPool.remove(channel)

			if (this._subscriptionPool.count() == 0) {
				this.send('FIN_REQUEST_UNSUBSCRIBE', channel)
				delete this._listLength[channel]
			}

			delete this._subIdToChannel[subId]
		} else { // it's a fin template element
			this._templateFactory.releaseTemplate(subId)
		}
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
		
		this._mutate({ id: itemId, op: 'set', prop: propName, args: [JSON.stringify(value)] })
	}
	
	this.append = function(itemId, propName /*, val1, val2, ... */) {
		var values = Array.prototype.slice.call(arguments, 2)
		for (var i=0; i < values.length; i++) {
			values[i] = JSON.stringify(values[i])
		}
		this._mutate({ id: itemId, op: 'append', prop: propName, args: values })
	}

	this._mutate = function(mutation, options) {
		options = options || {}
		
		if (options.mute !== true) {
			this.send('FIN_REQUEST_MUTATE_ITEM', mutation)
		}
		this._handleItemMutation(mutation)
	}
	
	/* 
	 * Focus an item property for editing. Any other focused client gets blurred.
	 * When another client requests focus, onBlurCallback gets called
	 */
	this.focus = function(itemId, propName, onBlurCallback) {
		var sessionId = this._sessionId,
			focusProperty = shared.keys.getFocusProperty(propName),
			subId
		
		subId = this.observe(itemId, focusProperty, bind(this, function(mutation, newSession) {
			if (!newSession || newSession == sessionId) { return }
			this.release(subId)
			onBlurCallback()
		}))
		this.set(itemId, '_focus', sessionId)
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
	
	this._deserializeMutation = function(mutation) {
		var args = mutation.args,
			operation = mutation.op
		switch(operation) {
			case 'set':
			case 'append':
				for (var i=0; i < args.length; i++) { args[i] = JSON.parse(args[i]) }
				break
			case 'splice':
				var items = args[0]
				for (var i=0; i < items.length; i++) { items[i] = JSON.parse(items[i]) }
				break
			default: throw logger.error("Unkown operation "+ operation)
		}
	}
	
	this._mutationCache = {}
	this._handleItemMutation = function(mutation, singleCallback) {
		if (singleCallback) {
			var args = [mutation.op].concat(mutation.args)
			setTimeout(bind(singleCallback, 'apply', this, args))
		} else {
			var channel = shared.keys.getItemPropertyChannel(mutation.id, mutation.prop)
				subs = this._subscriptionPool.get(channel)
			
			this._deserializeMutation(mutation)
			mutation = this._cacheMutation(mutation, channel)
			
			for (var subId in subs) {
				var args = [mutation.op].concat(mutation.args)
				// TODO should we really need the if check here? 
				// If yes, then lets at least delete the subId key from subs
				// when we find that there is no callback
				if (subs[subId]) { subs[subId].apply(this, args) }
			}
		}
	}
	
	this._cacheMutation = function(mutation, channel) {
		var mutationCache = this._mutationCache,
			cachedMutation = mutationCache[channel],
			cachedArgs = cachedMutation && cachedMutation.args
		
		if (!cachedMutation) {
			return mutationCache[channel] = mutation
		}
		
		switch(mutation.op) {
			case 'set':
				mutationCache[channel] = mutation
				break
			case 'append':
				cachedMutation.args[0] = cachedArgs[0].concat(mutation.args)
				break
			case 'splice':
				var spliceArgs = [0, mutation.index].concat(mutation.args)
				Array.prototype.splice.apply(cachedMutation.args, spliceArgs)
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
				throw logger.error("Unkown operation "+ operation)
		}
		return mutationCache[channel]
	}
	
	
	this._handleQueryMutation = function(mutation, singleCallback) {
		var channel = mutation.id,
			subs = this._subscriptionPool.get(channel)
		
		if (singleCallback) {
			// TODO do we need the second argument?
			setTimeout(bind(this, singleCallback, mutation, mutation.args[0]))
		} else {
			this._cacheMutation(mutation, channel)
			for (var subId in subs) {
				subs[subId](mutation, mutation.args[0])
			}
		}
	}
	
	// Private method - hook up all internals
	this.init = function() {
		this._requestCallbacks = {}
		
		this._viewFactory = new client.ViewFactory()
		this._templateFactory = new client.TemplateFactory(this._viewFactory)
		
		this._client = new client.Client()
		
		this._client.registerEventHandler('FIN_RESPONSE', bind(this, function(response) {
			this._executeCallback(response._requestId, response.data)
		}))
		
		this._client.registerEventHandler('FIN_EVENT_ITEM_MUTATED', bind(this, function(mutationJSON) {
			var mutation = JSON.parse(mutationJSON)
			this._handleItemMutation(mutation)
		}))
		
		this._client.registerEventHandler('FIN_EVENT_QUERY_MUTATED', bind(this, function(mutationJSON) {
			this._handleQueryMutation(JSON.parse(mutationJSON))
		}))
	}
})
