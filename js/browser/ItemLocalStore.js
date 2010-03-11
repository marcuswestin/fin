jsio('from common.javascript import Class, bind')

exports = Class(function() {

	this.init = function() {
		this._items = {}
	}
	
	this.ensureExists = function() {}
	
	this.getAllItems = function(callback) {
		var items = []
		for (var itemId in this._items) {
			items.push(this._items[itemId])
		}
		callback(null, items)
	}
	
	this.getItemData = function(itemId, callback) {
		if (!this._items[itemId]) { this._items[itemId] = {} }
		callback(null, this._items[itemId])
	}
	
	this.storeItemData = function(itemData, callback) {
		this._items[itemData._id] = itemData
		logger.debug('store item data', JSON.stringify(itemData))
		callback(null, this._items[itemData._id])
	}
})