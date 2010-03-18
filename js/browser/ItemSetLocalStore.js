jsio('from common.javascript import Class, bind, isArray')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.getItems = function(setId, callback) {
		var items = []
		for (var itemId in this._itemSets[setId]) {
			items.push(itemId)
		}
		setTimeout(bind(callback(null, items))
	}
	
	this.isInSet = function(setId, itemId, callback) {
		var isIn = (this._itemSets[setId][itemId] ? true : false)
		setTimeout(bind(callback, null, isIn))
	}
	
	this.addToSet = function(setId, itemIds, callback) {
		if (!this._itemSets[setId]) { this._itemSets[setId] = {} }
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			this._itemSets[setId][itemId] = true
		}
		setTimeout(bind(callback, null))
	}
	
	this.removeFromSet = function(setId, itemId, callback) {
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			delete this._itemSets[setId][itemId]
		}
		setTimeout(bind(callback, null))
	}
})
