jsio('from shared.javascript import Class, map, bind, blockCallback')
jsio('from net.interfaces import Server')
jsio('import shared.keys')
jsio('import server.Connection')

exports = Class(Server, function(supr) {
	
	this.init = function(redis) {
		supr(this, 'init');
		this._redis = redis
		this._uniqueId = 0
		this._redisClient = this._createRedisClient()

		// TODO For now we clear out all the query locks on every start up.
		//	This is because if the query observer loses its connection to 
		//	the redis server before shut down, then it never gets the chance
		//	to release the queries it is observing. I'm not sure what the correct
		//	solution to the this problem is.
		this._redisClient.stream.addListener('connect', bind(this, function() {
			var locksPattern = shared.keys.getQueryLockPattern()
			this._redisClient.keys(locksPattern, bind(this, function(err, keysBytes) {
				if (err) { throw logger.error('Could not retrieve query lock keys on startup', err) }
				if (!keysBytes) { return }
				// This is really really ugly - keys are concatenated with commas. Split on ,L and then append
				//	an L in front of every key. This will break if there is a query with the string ",L" in a key or value
				var keys = keysBytes.toString().substr(1).split(',L') 
				logger.log("Clear out query lock keys", keys)
				for (var i=0, key; key = keys[i]; i++) {
					this._redisClient.del('L' + key, function(err) {
						if (err) { throw logger.error("Could not clear out key") }
					})
				}
			}))
		}))
	}
	
	this._createRedisClient = function() {
		var client = this._redis.createClient()
		client.stream.setTimeout(0) // the stream is the redis client's net connection
		return client
	}

	var connectionId = 0 // TODO Each server will need a unique id as well to make each connection id globally unique
	this.buildProtocol = function() {
		return new server.Connection('c' + connectionId++, this._createRedisClient());
	}

/*******************************
 * Connection request handlers *
 *******************************/
	this.getListItems = function(listKey, from, to, callback) {
		this._redisClient.lrange(listKey, from, to, bind(this, function(err, itemBytesArray) {
			if (err) { throw logger.error('could not retrieve list range', listKey, from, to, err) }
			if (!itemBytesArray) {
				callback([])
				return
			}
			
			var items = map(itemBytesArray, function(itemBytes) { return itemBytes.toString() })
			callback(items)
		}))
	}
	
	this.retrieveStateMutation = function(key, type, callback) {
		switch(type) {
			case 'BYTES':
				this._retrieveBytes(key, function(json) {
					callback({ id: key, op: 'set', args: [json] })
				})
				break
			
			case 'SET':
				this.retrieveSet(key, function(members) {
					callback({ id: key, op: 'sadd', args: members })
				})
				break
				
			default:
				throw logger.error('could not retrieve state mutation of unknown type', type, key)
		}
	}
	
	this._retrieveBytes = function(key, callback) {
		this._redisClient.get(key, function(err, valueBytes) {
			if (err) { throw logger.error('could not retrieve BYTES for key', key, err) }
			callback((valueBytes ? valueBytes.toString() : "null"))
		})
	}
	
	this.retrieveSet = function(key, callback) {
		this._redisClient.smembers(key, bind(this, function(err, membersBytes) {
			if (err) { throw logger.error('could not retrieve set members', key, err) }
			membersBytes = membersBytes || []
			var members = []
			for (var i=0, memberBytes; memberBytes = membersBytes[i]; i++) {
				members.push(memberBytes.toString())
			}
			callback(members)
		}))
		
	}
	
	this.monitorQuery = function(queryJSON) {
		var queryKey = shared.keys.getQueryKey(queryJSON),
			lockKey = shared.keys.getQueryLockKey(queryJSON)
		
		this._redisClient.get(lockKey, bind(this, function(err, queryIsHeld) {
			if (err) { throw logger.error('could not check for query lock', lockKey, err) }
			if (queryIsHeld) { return }

			logger.log('Publish request for query observer to monitor this query', queryJSON)
			this._redisClient.publish(shared.keys.queryRequestChannel, queryJSON)
		}))
	}
	
	this.createItem = function(itemProperties, origConnection, callback) {
		this._redisClient.incr(shared.keys.uniqueIdKey, bind(this, function(err, newItemId) {
			if (err) { throw logger.error('Could not increment unique item id counter', err) }
			
			var doCallback = blockCallback(bind(this, callback, newItemId), { throwErr: true, fireOnce: true })
			
			for (var propName in itemProperties) {
				var value = JSON.stringify(itemProperties[propName]),
					key = shared.keys.getItemPropertyKey(newItemId, propName),
					mutation = { id: key, op: 'set', args: [value] }
				
				this.mutateItem(mutation, origConnection, doCallback.addBlock())
			}
			
			doCallback.tryNow()
		}))
	}
	
	// TODO Only publish srem and sadd mutations if the membership changed
	this._operationMap = {
		'set': 'set',
		'listAppend': 'rpush',
		'listPrepend': 'lpush',
		'sadd': 'sadd',
		'srem': 'srem'
	}
	this.mutateItem = function(mutation, originConnection, callback) {
		var key = mutation.id,
			propName = shared.keys.getKeyInfo(key).property,
			operation = this._operationMap[mutation.op],
			args = Array.prototype.slice.call(mutation.args, 0)
			connId = originConnection ? originConnection.getId() : '',
			mutationBytes = connId.length + connId + JSON.stringify(mutation)
		
		if (connId.length > 9) {
			throw logger.error("Connection ID is longer than 9 digits! Parsing this connection ID won't work")
		}
		
		args.unshift(key)
		logger.log('Apply and publish mutation', operation, args)
		if (callback) { args.push(callback) }
		this._redisClient[operation].apply(this._redisClient, args)
		
		// TODO clients should subscribe against pattern channels, 
		//	e.g. for item props *:1@type:* and for prop channels *:#type:*
		//	mutations then come with a single publication channel, 
		//	e.g. :1@type:#type: for a mutation that changes the type of item 1
		var propChannel = shared.keys.getPropertyChannel(propName)
		
		this._redisClient.publish(key, mutationBytes)
		this._redisClient.publish(propChannel, mutationBytes)
	}
})

