jsio('from common.javascript import Singleton, bind')
jsio('import common.itemFactory')
jsio('import browser.Client')
jsio('import browser.templateFactory')

exports = Singleton(function(){
	
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
		return this.applyTemplate('(( Input ' + propertyName + '))', itemId)
	}
	
	// Apply an item to a fin template string
	this.applyTemplate = function(templateString, item) {
		if (typeof item == 'string') { item = this.getItem(item) }
		return browser.templateFactory.applyTemplate(templateString, item);
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
			setTimeout(bind(common.itemFactory, 'loadItemSnapshot', properties), 0)
		})
		
		// When an item has succesfully mutated, apply the mutation
		this.handleEvent('FIN_EVENT_ITEM_MUTATED', function(mutation) {
			var item = common.itemFactory.getItem(mutation._id)
			setTimeout(bind(item, 'applyMutation', mutation, false), 0)
		})
	}
})
