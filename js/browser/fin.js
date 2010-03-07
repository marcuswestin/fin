jsio.path.browser = '../js';
jsio.path.common = '../js';

jsio('from common.javascript import Singleton, bind')
jsio('import common.itemFactory')
jsio('import common.Item')
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
	
	// Private method - hook up all internals
	this.init = function() {
		this._client = new browser.Client();
		
		// Whenever a new item is created, subscribe to it and hook up to send mutations to server
		common.itemFactory.subscribe('ItemCreated', bind(this, function(item) {
			this._client.sendFrame('FIN_REQUEST_SUBSCRIBE_ITEM', { id: item.getId() });
			item.subscribe('Mutating', bind(this._client, 'sendFrame', 'FIN_REQUEST_MUTATE_ITEM'))
		}));
		
		this.handleEvent('FIN_EVENT_ITEM_SNAPSHOT', function(properties) {
			common.itemFactory.loadItemSnapshot(properties)
		})
		
		// When an item has succesfully mutated, apply the mutation
		this.handleEvent('FIN_EVENT_ITEM_MUTATED', function(mutation) {
			var item = common.itemFactory.getItem(mutation._id)
			item.applyMutation(mutation);
		})
	}
})
