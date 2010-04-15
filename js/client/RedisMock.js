jsio('from shared.javascript import Class, Singleton, bind')
jsio('import shared.Publisher')

var ClientStreamMock = Class(function() {
	this.setTimeout = function() {}
})

var RedisClientMock = Class(shared.Publisher, function(supr) {
	this.init = function() {
		supr(this, 'init')
		this._state = {}
		this.stream = new ClientStreamMock()
	}
	
	this.set = function(key, value) {
		this._state[key] = value
	}

	this.get = function(key, callback) {
		callback(null, this._state[key])
	}
	
	this.sadd = function(key, member) {
		if (!this._state[key]) { this._state[key] = {} }
		this._state[key][member] = true
	}
	
	this.srem = function(key, member) {
		delete this._state[key][member]
	}
	
	this.smembers = function(key, callback) {
		callback(null, this._state[key])
	}

	this.hgetall = function(key, callback) {
		callback(this._state[key])
	}
	
	this.hset = function(key, property, value) {
		if (!this._state[key]) {  this._state[key] = {} }
		this._state[key][property] = value
	}
	
	this.hget = function(key, property, callback) {
		callback(this._state[key] && this._state[key][property])
	}
	
	this.incr = function(key, callback) {
		this._state[key] = (typeof this._state[key] == 'number' ? this._state[key] + 1 : 0)
		callback(null, this._state[key])
	}
	
	this.subscribeTo = function(channel, callback) {
		this.subscribe(channel, callback)
	}
	
	this.publish = function(channel, message) {
		setTimeout(bind(this, '_publish', channel, message))
	}
})

exports = Singleton(function() {
	
	this.createClient = function() {
		return new RedisClientMock();
	}
})
