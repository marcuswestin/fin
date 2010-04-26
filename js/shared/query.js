jsio('from shared.javascript import Class, bind, bytesToString, blockCallback')
jsio('import shared.keys')
jsio('import shared.mutations')

var _redis = null,
	_queries = [],
	_redisLockClient = null,
	_redisRequestClient = null

exports.init = function(redis) {
	_redis = redis
	_redisLockClient = _redis.createClient()
	_redisLockClient.stream.setTimeout(0)
	
	_redisRequestClient = _redis.createClient()
	_redisRequestClient.stream.setTimeout(0)
	_redisRequestClient.stream.addListener('connect', function() {
		_redisRequestClient.subscribeTo(shared.keys.queryRequestChannel, function(channel, queryJSONBytes) {
			_monitorQuery(bytesToString(queryJSONBytes))
		})
	})
}

exports.release = function() {
	logger.log("Releasing queries...", _queries.length)
	for (var i=0, query; query = _queries[i]; i++) {
		query.release()
	}
	logger.log("Done releasing queries")
}

function _monitorQuery(queryJSON) {
	var lockKey = shared.keys.getQueryLockKey(queryJSON)
	
	logger.log('Attempt to grab lock for', lockKey)
	_redisLockClient.setnx(lockKey, 1, function(err, iGotTheLock) {
		if (err) { throw logger.error('Could not attempt to grab a query lock', lockKey, err) }
		if (!iGotTheLock) { 
			logger.log('I did not get the lock')
			return 
		}
		logger.log('I got the lock - create query object and start monitoring for query changes', queryJSON)
		try { 
			var query = new _Query(lockKey, queryJSON)
			_queries.push(query)
		} catch (e) { 
			logger.error('Could not parse queryJSON. Releasing query key', queryJSON, e)
			_redisLockClient.del(lockKey)
		}
	})
}

_Query = Class(function() {
	
	this.init = function(lockKey, queryJSON) {
		this._queryKey = shared.keys.getQueryKey(queryJSON)
		this._queryChannel = shared.keys.getQueryChannel(queryJSON)
		this._query = JSON.parse(queryJSON)
		this._lockKey = lockKey

		this._redisSubClient = _redis.createClient()
		this._redisCommandClient = _redis.createClient()
		this._redisSubClient.stream.setTimeout(0)
		this._redisCommandClient.stream.setTimeout(0)
		
		var redisReadyCallback = blockCallback(bind(this, '_onRedisReady'))
		
		this._redisSubClient.stream.addListener('connect', redisReadyCallback.addBlock())
		this._redisCommandClient.stream.addListener('connect', redisReadyCallback.addBlock())
	}
	
	this._onRedisReady = function() {
		for (var propName in this._query) {
			var propChannel = shared.keys.getPropertyChannel(propName),
				propKeyPattern = shared.keys.getPropertyKeyPattern(propName)

			this._redisSubClient.subscribeTo(propChannel, bind(this, '_onMutation'))

			logger.warn('About to process all the keys matching property', propName, 'This can get really really expensive!');
			this._redisCommandClient.keys(propKeyPattern, bind(this, function(err, keysBytes) {
				if (err) { throw logger.error('Could not retrieve keys for processing', propKeyPattern, err) }
				if (!keysBytes) { return }
				this._processKeys(propName, keysBytes.toString().split(','))
			}))
		}
	}
	
	this._processKeys = function(propName, itemPropKeys) {
		for (var i=0, itemPropKey; itemPropKey = itemPropKeys[i]; i++) {
			var itemId = shared.keys.getKeyInfo(itemPropKey).id
			
			this._processItemProperty(itemId, propName, itemPropKey)
		}
	}
	
	this._onMutation = function(channel, mutationBytes) {
		var mutationInfo = shared.mutations.parseMutationBytes(mutationBytes),
			mutation = JSON.parse(mutationInfo.json),
			itemId = mutation.id,
			properties = mutation.props
		
		// TODO This could be done better and correctly by processing all the properties 
		//	in an mset command at once, rather than handling the sets independently.
		//	Also, we have the values of the props in the mutation object - no need
		//	to get them from the DB
		for (var i=0, propName; propName = properties[i]; i++) {
			if (!(propName in this._query)) { continue; }
			var itemPropKey = shared.keys.getItemPropertyKey(itemId, propName)
			this._processItemProperty(itemId, propName, itemPropKey)
		}
	}
		
	this._processItemProperty = function(itemId, propName, itemPropKey) {
		var queryKey = this._queryKey
		
		this._redisCommandClient.get(itemPropKey, bind(this, function(err, valueBytes) {
			if (err) { throw logger.error('Could not retrieve value of item for query', itemPropKey, queryKey, err) }
			var value = bytesToString(valueBytes),
				propCondition = this._query[propName],
				isLiteral = (typeof propCondition == 'string'),
				compareOperator = isLiteral ? '=' : propCondition[0],
				compareValue = isLiteral ? propCondition : propCondition[1],
				shouldBeInSet = null
			
			shouldBeInSet = (compareOperator == '=') ? (value == compareValue)
						: (compareOperator == '<') ? (value < compareValue)
						: (compareOperator == '>') ? (value > compareValue)
						: logger.error('Unknown compare operator', compareOperator, queryKey, this._query, propName)

			var redisOp = shouldBeInSet ? 'sadd' : 'srem'
			this._redisCommandClient[redisOp](queryKey, itemId, bind(this, function(err, opChangedSet) {
				if (err) { throw logger.error('Could not modify query set', redisOp, queryKey, err) }
				if (!opChangedSet) { return } // the item was already in/not in set, and the operation did not end up changing the set
				logger.log('Processed:', value, compareOperator, compareValue, 'Belongs?', shouldBeInSet)
				var mutation = {}
				mutation.op = redisOp
				mutation.id = this._queryChannel
				mutation.args = [itemId]
				this._redisCommandClient.publish(this._queryChannel, JSON.stringify(mutation))
			}))
		}))
	}
	
	this.release = function() {
		this._redisCommandClient.del(this._lockKey)
	}
})
