jsio('from common.javascript import Class, Publisher, bind')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.isInSet = function(setId, itemId, callback) {
		callback(!!(this._itemSets[setId] && this._itemSets[setId][itemId]))
	}
	
	this.addToSet = function(setId, itemId, callback) {
		if (!this._itemSets[setId]) { this._itemSets[setId] = {} }
		this._itemSets[setId][itemId] = true
		callback()
	}
	
	this.removeFromSet = function(setId, itemId, callback) {
		if (!this._itemSets[setId]) { return }
		delete this._itemSets[setId][itemId]
	}
	
})
