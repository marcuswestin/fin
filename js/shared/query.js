jsio('from shared.javascript import Class, bind, bytesToString')
jsio('import shared.keys')
jsio('import shared.mutations')

var _redisCommandClient,
	_redisSubscribeClient,
	_queries = []

exports.setRedisClients = function(subscribeClient, commandClient) {
	_redisSubscribeClient = subscribeClient
	_redisCommandClient = commandClient
}

exports.monitorQuery = function(queryJSON) {
	var lockKey = shared.keys.getQueryLockKey(queryJSON)
	
	logger.log('Attempt to grab lock for', lockKey)
	_redisCommandClient.setnx(lockKey, 1, function(err, iGotTheLock) {
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
			_redisCommandClient.del(lockKey)
		}
	})
}

exports.releaseQueries = function() {
	logger.log("Releasing queries...", _queries.length)
	for (var i=0, query; query = _queries[i]; i++) {
		_redisCommandClient.del(query._lockKey)
	}
	logger.log("Done releasing queries")
}

_Query = Class(function() {
	
	this.init = function(lockKey, queryJSON) {
		this._queryKey = shared.keys.getQueryKey(queryJSON)
		this._queryChannel = shared.keys.getQueryChannel(queryJSON)
		this._query = JSON.parse(queryJSON)
		this._lockKey = lockKey
		
		for (var propName in this._query) {
			var propChannel = shared.keys.getPropertyChannel(propName),
				propKeyPattern = shared.keys.getPropertyKeyPattern(propName)

			_redisSubscribeClient.subscribeTo(propChannel, bind(this, '_onItemPropertyChange'))

			logger.warn('About to process all the keys matching property', propName, 'This can get really really expensive!');
			_redisCommandClient.keys(propKeyPattern, bind(this, function(err, keysBytes) {
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
	
	this._onItemPropertyChange = function(channel, mutationBytes) {
		var mutationInfo = shared.mutations.parseMutationBytes(mutationBytes),
			mutation = JSON.parse(mutationInfo.json),
			itemId = mutation.id,
			propName = mutation.prop,
			itemPropKey = shared.keys.getItemPropertyKey(itemId, propName),
			queryKey = this._queryKey

		this._processItemProperty(itemId, propName, itemPropKey)
	}
		
	this._processItemProperty = function(itemId, propName, itemPropKey) {
		var queryKey = this._queryKey
		
		_redisCommandClient.get(itemPropKey, bind(this, function(err, valueBytes) {
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
			_redisCommandClient[redisOp](queryKey, itemId, bind(this, function(err, opChangedSet) {
				if (err) { throw logger.error('Could not modify query set', redisOp, queryKey, err) }
				logger.log('Processed:', value, compareOperator, compareValue, 'Belongs?', shouldBeInSet, 'Changed?', opChangedSet)
				if (!opChangedSet) { return } // the item was already in/not in set, and the operation did not end up changing the set
				var mutation = {}
				mutation.op = redisOp
				mutation.id = this._queryChannel
				mutation.args = [itemId]
				_redisCommandClient.publish(this._queryChannel, JSON.stringify(mutation))
			}))
		}))
	}
})
