jsio('from shared.javascript import Class, bind, bytesToString, blockCallback, map')
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
		this._query = JSON.parse(queryJSON)
		this._properties = map(this._query, function(key, val){ return key })
		this._lockKey = lockKey

		this._redisSubClient = _redis.createClient()
		this._redisCommandClient = _redis.createClient()
		this._redisSubClient.stream.setTimeout(0)
		this._redisCommandClient.stream.setTimeout(0)
		
		var redisReadyCallback = blockCallback(bind(this, '_onRedisReady'), {throwErr: true})
		
		this._redisSubClient.stream.addListener('connect', redisReadyCallback.addBlock())
		this._redisCommandClient.stream.addListener('connect', redisReadyCallback.addBlock())
	}
	
	this.release = function() { this._redisCommandClient.del(this._lockKey) }
	
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
			
			this._processItem(itemId)
		}
	}
	
	this._onMutation = function(channel, mutationBytes) {
		var mutationInfo = shared.mutations.parseMutationBytes(mutationBytes),
			mutation = JSON.parse(mutationInfo.json),
			key = mutation.id,
			itemId = shared.keys.getKeyInfo(key).id
		
		this._processItem(itemId)
	}
		
	this._processItem = function(itemId) {
		var query = this._query,
			queryKey = this._queryKey,
			properties = this._properties,
			self = this
		
		logger.log('Check membership for:', itemId, query)
		
		function processProperty(propIndex) {
			var propName = properties[propIndex],
				itemPropKey = shared.keys.getItemPropertyKey(itemId, propName)
			
			self._redisCommandClient.get(itemPropKey, function(err, valueBytes) {
				
				var value = valueBytes ? bytesToString(valueBytes) : false,
					propCondition = query[propName],
					isLiteral = (typeof propCondition != 'object' || propCondition == null),
					compareOperator = isLiteral ? '=' : propCondition.op,
					compareValue = isLiteral ? propCondition : propCondition.value
				
				// an unset value is interpreted as the same as a null value,
				//  e.g. { type: null } matches both items with type set to null 
				//  and items with type unset
				logger.debug("Retrieved for JSON parsing", ':', typeof value, value)
				if (value) { value = JSON.parse(value) }
				logger.debug("After JSON parsing", ':', typeof value, value)
				
				var couldBeInSet = (compareOperator == '=') ? (value == compareValue)
							: (compareOperator == '!=') ? (value != compareValue)
							: (compareOperator == '<') ? (value < compareValue)
							: (compareOperator == '>') ? (value > compareValue)
							: logger.error('Unknown compare operator', compareOperator, queryKey, query, propName)
				
				logger.log('Check ' + itemPropKey +':', '[in db: ' + JSON.stringify(value) + ']', compareOperator, '[query wants: ' + JSON.stringify(compareValue) + ']', 'match?', couldBeInSet)
				
				if (!couldBeInSet) {
					self._removeIfMember(itemId)
				} else {
					if (propIndex == 0) { self._addIfNotMember(itemId) }
					else { processProperty(propIndex - 1) }
				}
			})
		}
		
		processProperty(properties.length - 1)
	}
	
	this._removeIfMember = function(itemId) {
		// TODO just srem and use the wasMember flag to determine whether to publish or not
		this._redisCommandClient.sismember(this._queryKey, itemId, bind(this, function(err, isMember) {
			if (!Boolean(isMember)) { return }
			this._mutate('srem', itemId)
		}))
	}
	
	this._addIfNotMember = function(itemId) {
		// TODO just sadd and use the wasMember flag to determine whether to publish or not
		this._redisCommandClient.sismember(this._queryKey, itemId, bind(this, function(err, isMember) {
			if (Boolean(isMember)) { return }
			this._mutate('sadd', itemId)
		}))
	}
	
	this._mutate = function(redisOp, itemId) {
		logger.log('Determined that item membership changed', redisOp, itemId)
		this._redisCommandClient[redisOp](this._queryKey, itemId, bind(this, function(err, opChangedSet) {
			if (err) { throw logger.error('Could not modify query set', redisOp, queryKey, err) }
			var queryKey = this._queryKey,
				mutation = { op: redisOp, id: queryKey, args: [itemId] }
			this._redisCommandClient.publish(queryKey, JSON.stringify(mutation))
		}))
	}
})
