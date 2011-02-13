var fs = require('fs'),
	sys = require('sys'),
	path = require('path'),
	Buffer = require('buffer').Buffer,
	util = require('./util')

var data = {},
	dataDumpFile = './node-engine-dump.json',
	pubsub = {}

module.exports = {
	getStore: getStore,
	getPubSub: getPubSub
}

if (path.existsSync(dataDumpFile)) {
	sys.puts('node engine found ' + dataDumpFile + ' - loading data...')
	data = JSON.parse(fs.readFileSync(dataDumpFile))
	sys.puts('done loading data')
}

process.on('SIGINT', function() {
	sys.puts('\nnode engine caught SIGINT - shutting down cleanly')
	process.exit()
})

process.on('exit', function() {
	sys.puts('node engine detected shutdown - dumping data...')
	fs.writeFileSync(dataDumpFile, JSON.stringify(data))
	sys.puts('done dumping data.')
})

function getStore() {
	return util.create(storeAPI)
}

function getPubSub() {
	return util.create(pubsubAPI)
}

/* The store's API
 *****************/
var storeAPI = {
	/* Getters
	 *********/
	getBytes: function(key, callback) {
		if (typeof data[key] == 'undefined') {
			callback && callback(null, null)
		} else if (typeof data[key] == 'string' || typeof data[key] == 'number') {
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('getBytes', 'string or number', key))
		}
	},
	
	getListItems: function(key, from, to, callback) {
		if (typeof data[key] == 'undefined') {
			callback && callback(null, [])
		} else if (!(data[key] instanceof Array)) {
			callback && callback(typeError('getListItems', 'list', key))
		} else {
			if (to < 0) { to = data[key].length + to + 1 }
			from = Math.max(from, 0)
			to = Math.min(to, data[key].length)
			callback && callback(null, data[key].slice(from, to - from))
		}
	},
	
	getMembers: function(key, callback) {
		if (typeof data[key] == 'undefined') {
			callback && callback(null, [])
		} else if (!(data[key] instanceof Array)) {
			callback && callback(typeError('getMembers', 'set', key))
		} else {
			callback && callback(null, data[key].members)
		}
	},
	
	/* Mutation handlers
	 *******************/
	handleMutation: function(operation, args) {
		storeAPI[operation].apply(this, args)
	},
	
	set: function(key, value, callback) {
		if (typeof data[key] == 'undefined' || typeof data[key] == 'string' || typeof data[key] == 'number') {
			data[key] = value
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('set', 'string or number', key), null)
		}
	},
	
	push: function(key, values, callback) {
		if (typeof data[key] == 'undefined') {
			data[key] = [].concat(values)
			callback && callback(null, null)
		} else if (data[key] instanceof Array) {
			data[key] = data[key].concat(values)
			callback && callback(null, null)
		} else {
			callback && callback(typeError('push', 'list', key), null)
		}
	},
	
	unshift: function(key, values, callback) {
		var values = Array.prototype.slice.call(arguments, 1)
		if (typeof data[key] == 'undefined') {
			data[key] = [].concat(values)
			callback && callback(null, null)
		} else if (data[key] instanceof Array) {
			data[key] = values.concat(data[key])
			callback && callback(null, null)
		} else {
			callback && callback(typeError('push', 'list', key), null)
		}
	},
	
	increment: function(key, callback) {
		if (typeof data[key] == 'undefined') {
			data[key] = 1
			callback && callback(null, data[key])
		} else if (typeof data[key] == 'number') {
			data[key] += 1
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('increment', 'number', key), null)
		}
	},
	
	decrement: function(key, callback) {
		if (typeof data[key] == 'undefined') {
			data[key] = -1
			callback && callback(null, data[key])
		} else if (typeof data[key] == 'number') {
			data[key] -= 1
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('decrement', 'number', key), null)
		}
	},
	
	add: function(key, value, callback) {
		if (typeof data[key] == 'undefined') {
			data[key] = value
			callback && callback(null, data[key])
		} else if (typeof data[key] == 'number') {
			data[key] += value
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('add', 'number', key), null)
		}
	},
	
	subtract: function(key, value, callback) {
		if (typeof data[key] == 'undefined') {
			data[key] = -value
			callback && callback(null, data[key])
		} else if (typeof data[key] == 'number') {
			data[key] -= value
			callback && callback(null, data[key])
		} else {
			callback && callback(typeError('subtract', 'number', key), null)
		}
	},
	
	sadd: function() { throw new Error('sadd not yet implemented') },
	srem: function() { throw new Error('srem not yet implemented') }	
}

var pubsubAPI = {
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
		delete this._subscriptions
	},

	subscribe: function(channel, callback) {
		if (!pubsub[channel]) { pubsub[channel] = [] }
		pubsub[channel].push(callback)
		this._subscriptions.push(this)
	},
	
	publish: function(channel, message) {
		if (!pubsub[channel]) { return }
		var messageBuffer = new Buffer(message),
			subscribers = pubsub[channel]
		for (var i=0, subscriber; subscriber = subscribers[i]; i++) {
			subscriber(channel, messageBuffer)
		}
	},
	
	unsubscribe: function(channel, callback) {
		var subscribers = pubsub[channel]
		for (var i=0, subscriber; subscriber = subscribers[i]; i++) {
			if (subscriber != callback) { continue }
			subscribers.splice(i, 1)
			break
		}
	}
}

function typeError(operation, type, key) {
	return '"'+operation+'" expected a '+type+' at key "'+key+'" but found a '+typeof data[key]
}
