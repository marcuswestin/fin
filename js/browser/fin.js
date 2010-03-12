jsio('from common.javascript import Singleton, bind, isArray')
jsio('import common.ItemFactory')
jsio('import common.ItemSetFactory')
jsio('import browser.ItemLocalStore')
jsio('import browser.ItemSetLocalStore')
jsio('import browser.Client')
jsio('import browser.TemplateFactory')
jsio('import browser.ViewFactory')
jsio('import browser.views.Value')
jsio('import browser.views.Input')

// expose fin to global namespace
window.fin = Singleton(function(){
	
	// Make sure you have a connection with the server before using fin
	this.connect = function(callback) {
		this._client.connect(callback)
	}
	
	// Grab an item from the database. If callback is given, it'll wait until the snapshot has loaded
	this.getItem = function(itemId, callback) {
		return this._itemFactory.getItem(itemId, callback)
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
		this._existsCallbacks[itemId] = callback
		this._client.sendFrame('FIN_REQUEST_ITEM_EXISTS', { _id: itemId })
	}
	
	// Private method - hook up all internals
	this.init = function() {
		this._existsCallbacks = {}
		
		this._client = new browser.Client()
		
		var localItemStore = new browser.ItemLocalStore()
		this._itemFactory = new common.ItemFactory(localItemStore)

		var localItemSetStore = new browser.ItemSetLocalStore()
		this._itemSetFactory = new common.ItemSetFactory(this._itemFactory, localItemSetStore)
		
		this._viewFactory = new browser.ViewFactory(this)
		this._templateFactory = new browser.TemplateFactory(this._viewFactory)

		this.registerView('Value', browser.views.Value)
		this.registerView('Input', browser.views.Input)
		
		// Whenever a new item is created, subscribe to it and hook up to send mutations to server
		this._itemFactory.subscribe('ItemCreated', bind(this, function(item) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEM', { id: item.getId() })
			// TODO This should just listen to ItemPropertyUpdated instead
			item.subscribe('Mutating', bind(this._client, 'sendFrame', 'FIN_REQUEST_MUTATE_ITEM'))
		}))
		
		this.handleEvent('FIN_RESPONSE_ITEM_EXISTS', bind(this, function(response) {
			var callback = this._existsCallbacks[response._id]
			delete this._existsCallbacks[response._id]
			callback(response.exists)
		}))
		
		this.handleEvent('FIN_EVENT_ITEM_SNAPSHOT', bind(this, function(properties) {
			this._itemFactory.handleItemSnapshot(properties)
		}))
		
		// When an item has succesfully mutated, apply the mutation
		this.handleEvent('FIN_EVENT_ITEM_MUTATED', bind(this, function(mutation) {
			this._itemFactory.handleMutation(mutation)
		}))

		this.handleEvent('FIN_EVENT_ITEMSET_MUTATED', bind(this, function(mutation) {
			this._itemSetFactory.handleMutation(mutation)
		}))

		this.handleEvent('FIN_EVENT_ITEMSET_SNAPSHOT', bind(this, function(snapshot) {
			this._itemSetFactory.handleSnapshot(snapshot)
		}))
	}
})
