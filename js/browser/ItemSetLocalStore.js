jsio('from common.javascript import Class, Publisher, bind')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.setSnapshot = function(setId, items) {
		this._itemSets[setId] = {}
		if (!items) { return }
		for (var i=0, item; item = items[i]; i++) {
			this._itemSets[setId][item] = true
		}
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
	
})
