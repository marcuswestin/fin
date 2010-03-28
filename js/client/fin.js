jsio('from shared.javascript import Singleton, bind, isArray')
jsio('import shared.ItemFactory')
jsio('import shared.ItemSetFactory')
jsio('import client.ItemLocalStore')
jsio('import client.ItemSetLocalStore')
jsio('import client.Client')
jsio('import client.TemplateFactory')
jsio('import client.ViewFactory')
jsio('import client.views.Value')
jsio('import client.views.Input')
jsio('import client.views.Number')
jsio('import client.views.Checkbox')

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
	
	// Grab an item from the database. If callback is given, it'll wait until the snapshot has loaded
	this.getItem = function(itemId) {
		return this._itemFactory.getItem(itemId)
	}
	
	this.getView = function(viewName /* viewArg1, viewArg2, ... */) {
		var args = Array.prototype.slice.call(arguments, 1)
		return this._viewFactory.getView(viewName, args)
	}
	
	this.getListView = function(viewName /* , viewArg1, viewArg2, ... */) {
		return this._viewFactory.getView(viewName, args)
	}
	
	// Apply an item to a fin template string
	this.applyTemplate = function(templateString, itemIds) {
		return this._templateFactory.applyTemplate(templateString, itemIds)
	}
	
	// Register yourself to handle events from the server
	this.handleEvent = function(eventName, callback) {
		this._client.registerEventHandler(eventName, callback)
	}
	
	this.getSessionId = function() {
		if (this._client.transport._conn && this._client.transport._conn._sessionKey) {
			return this._client.transport._conn._sessionKey
		} else {
			return (this._fakeSessionId || (this._fakeSessionId = 'FAKE_CONNECTION_ID_' + new Date().getTime()))
		}
	}
	
	// Grab an item set
	// conditions == { type: 'bug', owner: 'marcus', priority: ['>', 4] }
	this.getItemSet = function(conditions) {
		var conditionArr = []
		for (var matchProperty in conditions) {
			var matchRule = conditions[matchProperty]
			var matchOperator = isArray(matchRule) ? matchRule[0] : '=' // infer = for simple key-value pairs, e.g. type: 'bug'
			var matchValue = isArray(matchRule) ? matchRule[1] : matchRule // if the match rule is not an array/tuple, it's the match value, e.g. owner: 'marcus'
			conditionArr.push([matchProperty, matchOperator, matchValue])
		}
		var itemSetId = this._itemSetFactory.getIdFromConditions(conditionArr)
		var shouldSubscribe = !this._itemSetFactory.hasItemSet(itemSetId)
		var itemSet = this._itemSetFactory.getItemSet(itemSetId)
		if (shouldSubscribe) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEMSET', { id: itemSetId })
		}
		
		return itemSet
	}
	
	this.registerView = function(viewName, viewConstructor) {
		this._viewFactory.registerView(viewName, viewConstructor)
	}
	
	this.exists = function(itemId, callback) {
		var requestId = this._scheduleCallback(callback)
		this._client.sendFrame('FIN_REQUEST_ITEM_EXISTS', { _requestId: requestId, _id: itemId })
	}
	
	this.createItem = function(data, callback) {
		var requestId = this._scheduleCallback(callback)
		this._client.sendFrame('FIN_REQUEST_CREATE_ITEM', { _requestId: requestId, data: data })
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
		
		var localItemStore = new client.ItemLocalStore()
		this._itemFactory = new shared.ItemFactory(localItemStore)

		var localItemSetStore = new client.ItemSetLocalStore()
		this._itemSetFactory = new shared.ItemSetFactory(this._itemFactory, localItemSetStore)
		
		this._viewFactory = new client.ViewFactory(this)
		this._templateFactory = new client.TemplateFactory(this._viewFactory)

		this.registerView('Value', client.views.Value)
		this.registerView('Input', client.views.Input)
		this.registerView('Number', client.views.Number)
		this.registerView('Checkbox', client.views.Checkbox)
		
		// Whenever a new item is created, subscribe to it and hook up to send mutations to server
		this._itemFactory.subscribe('ItemCreated', bind(this, function(item) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEM', { id: item.getId() })
		}))

		this._itemFactory.subscribe('ItemMutating', bind(this, function(mutation) {
			this._client.sendFrame('FIN_REQUEST_MUTATE_ITEM', mutation)
		}))
		
		this._itemSetFactory.subscribe('ReductionAdded', bind(this, function(itemSetId, reductionId) {
			this._client.sendFrame('FIN_REQUEST_ADD_REDUCTION', { id: itemSetId, reductionId: reductionId })
		}))
		
		this.handleEvent('FIN_RESPONSE_ITEM_EXISTS', bind(this, function(response) {
			this._executeCallback(response._requestId, response.exists)
		}))
		
		this.handleEvent('FIN_RESPONSE_CREATE_ITEM', bind(this, function(response) {
			var item = this._itemFactory.getItem(response.item)
			this._executeCallback(response._requestId, item)
		}))
		
		this.handleEvent('FIN_EVENT_ITEM_SNAPSHOT', bind(this, function(properties) {
			this._itemFactory.handleItemSnapshot(properties)
		}))
		
		// When an item has succesfully mutated, apply the mutation
		this.handleEvent('FIN_EVENT_ITEM_MUTATED', bind(this, function(mutation) {
			this._itemFactory.handleMutation(mutation, true)
		}))
		
		this.handleEvent('FIN_EVENT_ITEMSET_MUTATED', bind(this, function(mutation) {
			this._itemSetFactory.handleMutation(mutation)
		}))
		
		this.handleEvent('FIN_EVENT_ITEMSET_SNAPSHOT', bind(this, function(snapshot) {
			this._itemSetFactory.handleSnapshot(snapshot)
		}))
	}
})
