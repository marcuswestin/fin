jsio('from common.javascript import Class, Publisher, bind')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.getItems = function(setId, callback) {
		var items = []
		for (var itemId in this._itemSets[setId]) {
			items.push(itemId)
		}
		callback(null, items)
	}
	
	this.setSnapshot = function(setId, items, callback) {
		this._itemSets[setId] = {}
		if (!items) { return }
		for (var i=0, item; item = items[i]; i++) {
			this._itemSets[setId][item] = true
		}
		callback(null)
	}
	
	this.isInSet = function(setId, itemId, callback) {
		var isIn = (this._itemSets[setId][itemId] ? true : false)
		callback(null, isIn)
	}
	
	this.addToSet = function(setId, itemId, callback) {
		this._itemSets[setId][itemId] = true
		callback(null)
	}
	
	this.removeFromSet = function(setId, itemId, callback) {
		delete this._itemSets[setId][itemId]
		callback(null)
	}
	
	// The client side currently depends on this being blocking
	this.addItems = function(setId, itemIds) {
		var itemSet = this._itemSets[setId]
		for (var i=0, itemId; itemId = itemIds[i]; i++) { itemSet[itemId] = true }
	}
	// The client side currently depends on this being blocking
	this.removeItems = function(setId, itemIds) {
		var itemSet = this._itemSets[setId]
		for (var i=0, itemId; itemId = itemIds[i]; i++) { delete itemSet[itemId] }
	}

})
