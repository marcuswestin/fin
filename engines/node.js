var Buffer = require('buffer').Buffer,
	util = require('./util'),
	create = util.create

var data = {},
	pubsub = {}

/* Get a store
 *************/
exports.getStore = function() {
	return create(storeAPI)
}

/* The store's API
 *****************/
var storeAPI = {
	/* Setup/teardown
	 ****************/
	initialize: function() {
		this._subscriptions = []
	},
	
	close: function() {
		for (var i=0, signal; signal = this._subscriptions[i]; i++) {
			var subscribers = pubsub[signal]
			for (var j=0, subscriber; subscriber = subscribers[j]; j++) {
				if (subscriber[1] != this) { continue }
				subscribers.splice(j, 1)
				break
			}
		}
	},

	/* Pubsub
	 ********/
	subscribe: function(channel, callback) {
		if (!pubsub[channel]) { pubsub[channel] = [] }
		pubsub[channel].push([callback, this])
	},
	
	publish: function(channel, message) {
		if (!pubsub[channel]) { return }
		var messageBuffer = new Buffer(message),
			subscribers = pubsub[channel]
		for (var i=0, subscriber; subscriber = subscribers[i]; i++) {
			subscriber[0](channel, messageBuffer)
		}
	},
	
	/* Getters
	 *********/
	getBytes: function(key, callback) {
		if (!data[key]) {
			callback(null, null)
		} else if (typeof data[key] == 'string' || typeof data[key] == 'number') {
			callback(null, data[key])
		} else {
			callback(typeError('getBytes', 'string or number', key))
		}
	},
	
	getListItems: function(key, from, to, callback) {
		if (!data[key]) {
			callback(null, [])
		} else if (!(data[key] instanceof Array)) {
			callback(typeError('getListItems', 'list', key))
		} else {
			if (to < 0) { to = data[key].length + to + 1 }
			from = Math.max(from, 0)
			to = Math.min(to, data[key].length)
			callback(null, data[key].slice(from, to - from))
		}
	},
	
	getMembers: function() { throw new Error("getMembers not yet implemented") },
	
	/* Mutation handlers
	 *******************/
	handleMutation: function(operation, args) {
		mutationHandlers[operation].apply(this, args)
	}
}

var mutationHandlers = {
	set: function(key, value) {
		if (typeof data[key] == 'undefined' || typeof data[key] == 'string' || typeof data[key] == 'number') {
			data[key] = value
		} else {
			throw typeError('set', 'string or number', key)
		}
	},
	
	push: function(key/* value1, value2, ... */) {
		var values = Array.prototype.slice.call(arguments, 1)
		if (typeof data[key] == 'undefined') {
			data[key] = values
		} else if (data[key] instanceof Array) {
			data[key] = data[key].concat(values)
		} else {
			throw typeError('push', 'list', key)
		}
	},
	
	unshift: function(key/* value1, value2, ... */) {
		var values = Array.prototype.slice.call(arguments, 1)
		if (typeof data[key] == 'undefined') {
			data[key] = values
		} else if (data[key] instanceof Array) {
			data[key] = values.concat(data[key])
		} else {
			throw typeError('push', 'list', key)
		}
	},
	
	increment: function(key) {
		if (typeof data[key] == 'undefined') {
			data[key] = 1
		} else if (typeof data[key] == 'number') {
			data[key] += 1
		} else {
			throw typeError('increment', 'number', key)
		}
	},
	
	decrement: function(key) {
		if (typeof data[key] == 'undefined') {
			data[key] = -1
		} else if (typeof data[key] == 'number') {
			data[key] -= 1
		} else {
			throw typeError('decrement', 'number', key)
		}
	},
	
	add: function(key, value) {
		if (typeof data[key] == 'undefined') {
			data[key] = value
		} else if (typeof data[key] == 'number') {
			data[key] += value
		} else {
			throw typeError('add', 'number', key)
		}
	},
	
	subtract: function(key, value) {
		if (typeof data[key] == 'undefined') {
			data[key] = -value
		} else if (typeof data[key] == 'number') {
			data[key] -= value
		} else {
			throw typeError('subtract', 'number', key)
		}
	},
	
	sadd: function() { throw new Error('sadd not yet implemented') },
	srem: function() { throw new Error('srem not yet implemented') }
}

function typeError(operation, type, key) {
	return new Error('"'+operation+'" expected a '+type+' at key "'+key+'" but found a '+typeof data[key])
}	
