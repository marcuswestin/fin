jsio('from shared.javascript import Class, Publisher, bind, isArray')

exports = Class(function() {
	
	this.init = function(redisClient) {
		this._redisClient = redisClient
	}
	
	this.getItems = function(setId, callback) {
		this._redisClient.smembers(setId, callback)
	}
	
	this.isInSet = function(setId, itemId, callback) {
		this._redisClient.sismember(setId, itemId, function(err, isInSet) {
			callback(err, Boolean(isInSet));
		})
	}
	
	this.addToSet = function(setId, itemIds, callback) {
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		var remaining = itemIds.length
		function onItemAdded(err) {
			if (err) { throw err }
			if (--remaining == 0) { callback(null) }
		}
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			this._redisClient.sadd(setId, itemId, onItemAdded)
		}
	}
	
	this.removeFromSet = function(setId, itemIds, callback) {
		if (!isArray(itemIds)) { itemIds = [itemIds] }
		var remaining = itemIds.length
		function onItemRemoved(err) {
			if (err) { throw err }
			if (--remaining == 0) { callback(null) }
		}
		for (var i=0, itemId; itemId = itemIds[i]; i++) {
			this._redisClient.srem(setId, itemId, onItemRemoved)
		}
	}
})
