jsio('from shared.javascript import Class, map, bind, blockCallback')
jsio('from net.interfaces import Server')
jsio('import shared.keys')

exports = Class(Server, function(supr) {
	
	this.init = function(redis, connectionCtor) {
		supr(this, 'init', [connectionCtor])
		this._redis = redis
		this._uniqueId = 0
		this._redisClient = this._createRedisClient()
	}
	
	this._createRedisClient = function() {
		var client = this._redis.createClient()
		client.stream.setTimeout(0) // the stream is the redis client's net connection
		return client
	}

	var connectionId = 0 // TODO Each server will need a unique id as well to make each connection id globally unique
	this.buildProtocol = function() {
		return new this._protocolClass('c' + connectionId++, this._createRedisClient());
	}

/*******************************
 * Connection request handlers *
 *******************************/
	this.data = function(op, key, callback) {
		this._redisClient[op](key, bind(this, function(err, byteValue) {
			if (err) { throw logger.error('could not retrieve properties for item', key, err) }
			callback(byteValue)
		}))
	}

	this.getQuerySet = function(queryJSON, callback) {
		var queryKey = shared.keys.getQueryKey(queryJSON),
			lockKey = shared.keys.getQueryLockKey(queryJSON)
		
		this._redisClient.get(lockKey, bind(this, function(err, holder) {
			if (err) { throw logger.error('could not check for query lock', lockKey, err) }
			if (holder) { return }
			// publish a request for a robot to start monitoring this query
			this._redisClient.publish('query_request_monitor', queryJSON)
		}))
		this._redisClient.smembers(queryKey, bind(this, function(err, members) {
			if (err) { throw logger.error('could not retrieve set members', queryKey, err) }
			callback(members || [])
		}))
	}
	
	this.createItem = function(itemData, callback) {
		this._redisClient.incr('__uniqueFinId', bind(this, function(err, newItemId) {
			var blockedCallback = blockCallback(bind(this, callback, newItemId))
			
			for (var property in itemData) {
				var releaseBlockFn = blockedCallback.addBlock(),
					itemPropKey = shared.keys.getItemPropertyKey(newItemId, property)
				
				this._redisClient.set(itemPropKey, itemData[property], releaseBlockFn)
			}
			blockedCallback.tryNow() // in case there was no itemData and no blocks were added
		}))
	}
	
	this.mutateItem = function(mutation, originConnectionId) {
		var key = mutation.args[0],
			keyInfo = shared.keys.getKeyInfo(key),
			operation = mutation.op,
			args = mutation.args,
			itemChannel = shared.keys.getItemPropertyChannel(keyInfo.id, keyInfo.prop),
			propertyChannel = shared.keys.getPropertyChannel(keyInfo.prop),
			mutationBytes = originConnectionId.length + originConnectionId + JSON.stringify(mutation)
		
		logger.log('Apply mutation', operation, args)
		this._redisClient[operation].apply(this._redisClient, args)
		
		logger.log('Publish channels', itemChannel, propertyChannel, mutation)
		this._redisClient.publish(itemChannel, mutationBytes)
		this._redisClient.publish(propertyChannel, mutationBytes)
	}
})

