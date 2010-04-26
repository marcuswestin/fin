jsio('from shared.javascript import Class, map, bind')
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
	this.getItemProperty = function(itemId, propName, callback) {
		var key = shared.keys.getItemPropertyKey(itemId, propName)
		
		this._redisClient.get(key, bind(this, function(err, valueBytes) {
			if (err) { throw logger.error('could not retrieve properties for item', key, err, err) }
			callback((valueBytes ? valueBytes.toString() : ''), key)
		}))
	}
	
	this.getQuerySet = function(queryJSON, callback) {
		var queryKey = shared.keys.getQueryKey(queryJSON),
			lockKey = shared.keys.getQueryLockKey(queryJSON)
		
		this._redisClient.get(lockKey, bind(this, function(err, queryIsHeld) {
			if (err) { throw logger.error('could not check for query lock', lockKey, err) }
			if (queryIsHeld) { return }

			logger.log('Publish request for query observer to monitor this query', queryJSON)
			this._redisClient.publish(shared.keys.queryRequestChannel, queryJSON)
		}))
		this._redisClient.smembers(queryKey, bind(this, function(err, members) {
			if (err) { throw logger.error('could not retrieve set members', queryKey, err) }
			callback(members || [])
		}))
	}
	
	this.createItem = function(itemProperties, origConnection, callback) {
		this._redisClient.incr(shared.keys.uniqueIdKey, bind(this, function(err, newItemId) {
			if (err) { throw logger.error('Could not increment unique item id counter', err) }
			var mutation = { id: newItemId, op: 'mset', props: [], args: [] },
				itemPropsEmpty = true

			for (var propName in itemProperties) {
				itemPropsEmpty = false
				mutation.args.push(shared.keys.getItemPropertyKey(newItemId, propName))
				mutation.args.push(itemProperties[propName])
				mutation.props.push(propName)
			}
			if (itemPropsEmpty) {
				callback(newItemId)
			} else {
				this.mutateItem(mutation, origConnection, bind(this, callback, newItemId))
			}
		}))
	}
	
	this.mutateItem = function(mutation, originConnection, callback) {
		var itemId = mutation.id,
			operation = mutation.op,
			connId = originConnection.getId(),
			properties = mutation.props,
			mutationBytes = connId.length + connId + JSON.stringify(mutation),
			channels = [],
			args = mutation.args
			
		switch(operation) {
			case 'mset':
				for (var i=0, propName; propName = properties[i]; i++) {
					channels.push(shared.keys.getItemPropertyChannel(itemId, propName))
					channels.push(shared.keys.getPropertyChannel(propName))
				}
				break;
			default:
				throw logger.error("Unkown operation "+ operation)
		}
		
		logger.log('Apply mutation', operation, args)
		if (callback) { args.push(callback) }
		this._redisClient[operation].apply(this._redisClient, args)
		
		// TODO clients should subscribe against pattern channels, 
		//	e.g. for item props *:1@type:* and for prop channels *:#type:*
		//	mutations then come with a single publication channel, 
		//	e.g. :1@type:#type: for a mutation that changes the type of item 1
		logger.log('Publish channels', channels, mutation)
		for (var i=0, channel; channel = channels[i]; i++) {
			this._redisClient.publish(channel, mutationBytes)
		}
	}
})

