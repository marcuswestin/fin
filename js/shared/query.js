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
		
		for (var property in this._query) {
			var propChannel = shared.keys.getPropertyChannel(property)
			_redisSubscribeClient.subscribeTo(propChannel, bind(this, '_onItemPropertyChange'))
		}
	}
	
	this._onItemPropertyChange = function(channel, mutationBytes) {
		var mutationInfo = shared.mutations.parseMutationBytes(mutationBytes),
			mutation = JSON.parse(mutationInfo.json)

		var itemId = mutation.id,
			propertyName = mutation.prop,
			itemPropKey = shared.keys.getItemPropertyKey(itemId, propertyName),
			queryKey = this._queryKey
		
		_redisCommandClient.get(itemPropKey, bind(this, function(err, valueBytes) {
			if (err) { throw logger.error('Could not retrieve value of item for query', itemPropKey, queryKey, err) }
			var value = bytesToString(valueBytes),
				propCondition = this._query[propertyName],
				isLiteral = (typeof propCondition == 'string'),
				compareOperator = isLiteral ? '=' : propCondition[0],
				compareValue = isLiteral ? propCondition : propCondition[1],
				shouldBeInSet = null
				
			shouldBeInSet = (compareOperator == '=') ? (value == compareValue)
						: (compareOperator == '<') ? (value < compareValue)
						: (compareOperator == '>') ? (value > compareValue)
						: logger.error('Unknown compare operator', compareOperator, queryKey, this._query, propertyName)
			
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

// Warning - HELLA expensive with large database
// exports.buildFromScratch = function(query) {
// 	var propertyChannelPattern = Data.getPropertyChannel('')
// 	
// 	// if we're clustering redis, the callback could be called multiple times, once for ezach redis instance
// 	Data.getAllKeys(propertyChannelPattern, function(itemKeys) {
// 		for (var i=0, itemKey; itemKey=itemKeys[i]; i++) {
// 			Data.getProperties(itemKey, function(itemProperties) {
// 				exports.applyQuery(query, itemProperties)
// 			})
// 		}
// 	})
// }

// exports.applyQuery = function(query, item, changedProperty) {
// 	var itemId = properties._id,
// 		shouldBeInSet = true
// 	if (changedProperty) {
// 		shouldBeInSet = filterProperty(properties[changedProperty], query[changedProperty])
// 	} else {
// 		for (var name in properties) {
// 			if (filterProperty(properties[name], query[name])) { continue }
// 			shouldBeInSet = false
// 			break
// 		}
// 	}
// 	
// 	if (shouldBeInSet) {
// 		Data.sadd(properties._id, function(err, wasInSet) {
// 			if (!wasInSet) {
// 				Data.publish(Data.getQueryChannel(query), )
// 			}
// 		})
// 	}
// 	
// 	this._store.isInSet(this._id, itemId, bind(this, function(err, isInSet) {
// 		if (err) { throw err }
// 
// 		if (isInSet == this._shouldBeInSet(data)) {
// 			if (isInSet && changedProperty) { // Item was in and stayed in set, but reduce property may have changed
// 				this._updateReductions(changedProperty, oldValue, data[changedProperty])
// 			}
// 		} else if (isInSet) {
// 			this._removeFromSet(itemId)
// 			for (var property in data) {
// 				this._updateReductions(property, data[property], undefined)
// 			}
// 		} else {
// 			this._addToSet(itemId)
// 			for (var property in data) {
// 				this._updateReductions(property, undefined, data[property])
// 			}
// 		}
// 	}))
// 	
// }





// An item updated locally - happens both on client and server side 
// this.handleItemUpdate = function(data, changedProperty, oldValue) {
// 	var itemId = data._id
// 	// TODO The changed property may have been a reduce. We should only test the condition who's property just changed
// 	// TODO We can do a remove/add to the redis set, and be told afterwards if it was already in the set or not. If it was already in the set, then don't publish
// 	this._store.isInSet(this._id, itemId, bind(this, function(err, isInSet) {
// 		if (err) { throw err }
// 
// 		if (isInSet == this._shouldBeInSet(data)) {
// 			if (isInSet && changedProperty) { // Item was in and stayed in set, but reduce property may have changed
// 				this._updateReductions(changedProperty, oldValue, data[changedProperty])
// 			}
// 		} else if (isInSet) {
// 			this._removeFromSet(itemId)
// 			for (var property in data) {
// 				this._updateReductions(property, data[property], undefined)
// 			}
// 		} else {
// 			this._addToSet(itemId)
// 			for (var property in data) {
// 				this._updateReductions(property, undefined, data[property])
// 			}
// 		}
// 	}))
// }
// 
// // An item was removed locally - happens both client and server side
// this._removeFromSet = function(itemId) {
// 	this._store.removeFromSet(this._id, itemId, bind(this, function(err, position) {
// 		if (err) { throw err }
// 		var mutation = { _id: this._id, remove: itemId }
// 		this._publish('Mutated', mutation)
// 		// TODO Maybe there should only be dependants, and no publications
// 		this._queueMutation(mutation)
// 	}))
// }
// 
// // An item was added locally - happens both client and server side
// this._addToSet = function(itemId) {
// 	this._store.addToSet(this._id, itemId, bind(this, function(err, position) {
// 		if (err) { throw err }
// 		var mutation = { _id: this._id, add: itemId }
// 		this._publish('Mutated', mutation)
// 		// TODO Maybe there should only be dependants, and no publications
// 		this._queueMutation(mutation)
// 	}))
// }