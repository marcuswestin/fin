var redis = require('../lib/redis-node-client/lib/redis-client')

function create(oldObject) {
	function F() {}
	F.prototype = oldObject;
	return new F();
}

/* Get a store
 *************/
exports.getStore = function() {
	var store = create(storeAPI)
	store.redisClient = redis.createClient()
	store.redisClient.stream.setTimeout(0)
	return store
}

/* The store's API
 *****************/
var storeAPI = {
	getString: getString,
	getListItems: getListItems,
	getMembers: getMembers,
	
	subscribe: createRedisOp('subscribeTo'),
	publish: createRedisOp('publish'),
	
	set: createRedisOp('set'),
	setIfNull: createRedisOp('setnx'), // Do we really want this?
	
	handleMutation: handleMutation,
	
	close: close
}

/* Getters
 *********/
// Returns a list of items, or an empty list if value at listKey is not set
function getListItems(listKey, from, to, callback) {
	this.redisClient.lrange(listKey, from, to, function(err, itemBytesArray) {
		if (err) { return callback(err, null) }
		if (!itemBytesArray) { return callback(null, []) }
		for (var items=[], i=0; i<itemBytesArray.length; i++) {
			items.push(itemBytesArray[i].toString())
		}
		callback(null, items)
	})
}

// Returns a string
function getString(key, callback) {
	this.redisClient.get(key, function(err, valueBytes) {
		if (err) { return callback(err) }
		if (!valueBytes) { return callback(null, null) }
		callback(null, valueBytes.toString())
	})
}

function getMembers(key, callback) {
	this.redisClient.smembers(key, function(err, membersBytes) {
		if (err) { return callback(err) }
		if (!membersBytes) { return callback(null, []) }
		for (var members=[], i=0; i<memberBytes.length; i++) {
			members.push(memberBytes[i].toString())
		}
		callback(null, members)
	})
}

function close() {
	this.redisClient.close()
}

var finToRedisOperationMap = {
	'set': 'set',
	'push': 'rpush',
	'unshift': 'lpush',
	'sadd': 'sadd',
	'srem': 'srem',
	'increment': 'incr',
	'decrement': 'decr',
	'add': 'incrby',
	'subtract': 'decrby'
}

function handleMutation(operation, args) {
	var redisOp = finToRedisOperationMap[operation]
	this.redisClient[redisOp].apply(this.redisClient, args)
}

function createRedisOp(redisOp) {
	return function() {
		var args = Array.prototype.slice.call(arguments, 0)
		this.redisClient[redisOp].apply(this.redisClient, args)
	}
}

