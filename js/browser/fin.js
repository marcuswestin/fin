jsio.path.browser = '../js';
jsio.path.common = '../js';

jsio('from common.javascript import Singleton, bind, isArray')
jsio('import common.itemFactory')
jsio('import common.Item')
jsio('import common.ItemSetFactory')
jsio('import browser.ItemSetLocalStore')
jsio('import browser.Client')
jsio('import browser.templateFactory')

fin = Singleton(function(){
	
	// Make sure you have a connection with the server before using fin
	this.connect = function(callback) {
		this._client.connect(callback)
	}
	
	// Grab an item from the database
	this.getItem = function(itemId) {
		return common.itemFactory.getItem(itemId)
	}
	
	// Get an input field for an item
	this.getInput = function(itemId, propertyName) {
		return this.getView('(( Input ' + propertyName + '))', itemId)
	}
	
	// Apply an item to a fin template string
	this.getView = function(templateString, items) {
		if (typeof items == 'string') { items = this.getItem(items) }
		var singleItem = (items instanceof common.Item)
		if (!singleItem) {
			for (var itemKey in items) {
				if (items[itemKey] instanceof common.Item) { continue }
				items[itemKey] = this.getItem(items[itemKey])
			}
		}
		return browser.templateFactory.applyTemplate(templateString, items, singleItem);
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
		var itemSet = this._itemSetFactory.getItemSetByConditions(conditionArr)
		this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEMSET', { id: itemSet.getId() });
		return itemSet
	}
	
	// Private method - hook up all internals
	this.init = function() {
		this._client = new browser.Client();
		var localStore = new browser.ItemSetLocalStore()
		this._itemSetFactory = new common.ItemSetFactory(localStore)
		
		// Whenever a new item is created, subscribe to it and hook up to send mutations to server
		common.itemFactory.subscribe('ItemCreated', bind(this, function(item) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEM', { id: item.getId() });
			item.subscribe('Mutating', bind(this._client, 'sendFrame', 'FIN_REQUEST_MUTATE_ITEM'))
		}));
		
		this.handleEvent('FIN_EVENT_ITEM_SNAPSHOT', function(properties) {
			common.itemFactory.handleItemSnapshot(properties)
		})
		
		// When an item has succesfully mutated, apply the mutation
		this.handleEvent('FIN_EVENT_ITEM_MUTATED', function(mutation) {
			common.itemFactory.handleMutation(mutation)
		})

		this.handleEvent('FIN_EVENT_ITEMSET_MUTATED', bind(this, function(mutation) {
			this._itemSetFactory.handleMutation(mutation)
		}))

		this.handleEvent('FIN_EVENT_ITEMSET_SNAPSHOT', bind(this, function(snapshot) {
			this._itemSetFactory.handleSnapshot(snapshot)
		}))
	}
})
