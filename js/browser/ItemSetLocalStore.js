jsio('from common.javascript import Class, Publisher, bind')

exports = Class(function() {
	
	this.init = function() {
		this._itemSets = {}
	}
	
	this.isInSet = function(setId, itemId, callback) {
		logger.warn("NOT IMPLEMENTED", 'isInSet')
	}
	
	this.addToSet = function(setId, itemId, callback) {
		logger.warn("NOT IMPLEMENTED", 'addToSet')
	}
	
	this.removeFromSet = function(setId, itemId, callback) {
		logger.warn("NOT IMPLEMENTED", 'removeFromSet')
	}
	
})
