exports.getStore = getStore

var redis = require('../lib/redis-node-client/lib/redis-client')

function create(oldObject) {
	function F() {}
	F.prototype = oldObject;
	return new F();
}

var storeAPI = {
	getListItems: getListItems,
	getBytes: getBytes,
	getMembers: getMembers,
	subscribe: subscribe,
	publish: publish,
	handleOperation: handleOperation,
	close: close
}

function getStore() { 
	var store = create(storeAPI)
	store.redisClient = redis.createClient()
	store.redisClient.stream.setTimeout(0)
	return store
	// client.redisClient.stream.addListener('connect', function() {
	// 	// For now we clear out all the query locks on every start up.
	// 	//	This is because if the query observer loses its connection to 
	// 	//	the redis server before shut down, then it never gets the chance
	// 	//	to release the queries it is observing. I'm not sure what the correct
	// 	//	solution to the this problem is.
	// 	var locksPattern = shared.keys.getQueryLockPattern()
	// 	this.redisClient.keys(locksPattern, function(err, keysBytes) {
	// 		if (err) { throw new Error('Could not retrieve query lock keys on startup: ' + err) }
	// 		if (!keysBytes) { return }
	// 		// This is really really ugly - keys are concatenated with commas. Split on ,L and then append
	// 		//	an L in front of every key. This will break if there is a query with the string ",L" in a key or value
	// 		var keys = keysBytes.toString().substr(1).split(',L') 
	// 		for (var i=0, key; key = keys[i]; i++) {
	// 			this.redisClient.del('L' + key, function(err) {
	// 				if (err) { throw logger.error("Could not clear out key") }
	// 			})
	// 		}
	// 	})
	// })
}


function getListItems(listKey, from, to, callback) {
	this.redisClient.lrange(listKey, from, to, function(err, itemBytesArray) {
		if (err) { return callback(err) }
		if (!itemBytesArray) { return callback(null, []) }
		for (var items=[], i=0; i<itemBytesArray.length; i++) {
			items.push(itemBytesArray[i].toString())
		}
		callback(null, items)
	})
}

function getBytes(key, callback) {
	this.redisClient.getBytes(key, function(err, value) {
		if (err) { return callback(err) }
		if (!valueBytes) { return callback(null, "null") }
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

function subscribe(channel, callback) {
	this.redisClient.subscribeTo(channel, callback)
}

function publish(channel, bytes) {
	this.redisClient.publish(channel, bytes)
}

function close() {
	this.redisClient.close()
}

var operationMap = {
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

function handleOperation(operation, args) {
	var redisOp = operationMap[operation]
	this.redisClient[redisOp].apply(this.redisClient, args)
}
