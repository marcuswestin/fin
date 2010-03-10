jsio('from common.javascript import Class, Publisher, bind')

exports = Class(function() {
	
	this.init = function(redisClient) {
		this._redisClient = redisClient
	}
	
	this.getItems = function(setId, callback) {
		this._redisClient.smembers(setId, callback)
	}
	
	this.isInSet = function(setId, itemId, callback) {
		this._redisClient.sismember(setId, itemId, callback)
	}
	
	this.addToSet = function(setId, itemId, callback) {
		this._redisClient.sadd(setId, itemId, callback)
	}
	
	this.removeFromSet = function(setId, itemId, callback) {
		this._redisClient.srem(setId, itemId, callback)
	}
})
