jsio('from shared.javascript import Class, bind, isArray')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.getItems = function(setId, callback) {
		var items = []
		for (var itemId in this._itemSets[setId]) {
			items.push(itemId)
		}
		setTimeout(function() { callback(null, items) })
	}
	
	this.isInSet = function(setId, itemId, callback) {
		var itemSet = this._itemSets[setId],
			isIn = Boolean(itemSet && itemSet[itemId])
		setTimeout(function() { callback(null, isIn) })
	}
	
	this.addToSet = function(setId, itemIds, callback) {
		if (!this._itemSets[setId]) { this._itemSets[setId] = {} }
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			this._itemSets[setId][itemId] = true
		}
		setTimeout(function() { callback(null) })
	}
	
	this.removeFromSet = function(setId, itemIds, callback) {
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			delete this._itemSets[setId][itemId]
		}
		setTimeout(function() { callback(null) })
	}
})
