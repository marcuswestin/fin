jsio('from shared.javascript import Class, map, bind, blockCallback')
jsio('from net.interfaces import Server')
jsio('import shared.keys')

exports = Class(Server, function(supr) {
	
	this.init = function(connectionCtor, storeEngine) {
		supr(this, 'init');
		this._storeEngine = storeEngine
		this._store = this._storeEngine.getStore()
		
		this._uniqueId = 0
		this._connectionCtor = connectionCtor;
	}
	
	var connectionId = 0 // TODO Each server will need a unique id as well to make each connection id globally unique
	this.buildProtocol = function() {
		return new this._connectionCtor('c' + connectionId++, this._storeEngine)
	}

/*******************************
 * Connection request handlers *
 *******************************/
	this.getListItems = function(listKey, from, to, callback) {
		if (!to) { to = -1 } // grab the entire list if no end index is specified
		this._store.getListItems(listKey, from, to, bind(this, function(err, items) {
			if (err) { throw logger.error('could not retrieve list range', listKey, from, to, err) }
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
		this._store.getBytes(key, function(err, value) {
			if (err) { throw logger.error('could not retrieve BYTES for key', key, err) }
			callback(value)
		})
	}
	
	this.retrieveSet = function(key, callback) {
		this._store.getMembers(key, bind(this, function(err, members) {
			if (err) { throw logger.error('could not retrieve set members', key, err) }
			callback(members)
		}))
		
	}
	
	this.monitorQuery = function(queryJSON) {
		var queryKey = shared.keys.getQueryKey(queryJSON),
			lockKey = shared.keys.getQueryLockKey(queryJSON)
		
		this._store.getBytes(lockKey, bind(this, function(err, queryIsHeld) {
			if (err) { throw logger.error('could not check for query lock', lockKey, err) }
			if (queryIsHeld) { return }
			
			logger.log('Publish request for query observer to monitor this query', queryJSON)
			this._store.publish(shared.keys.queryRequestChannel, queryJSON)
		}))
	}
	
	this.createItem = function(itemProperties, origConnection, callback) {
		this._store.increment(shared.keys.uniqueIdKey, bind(this, function(err, newItemId) {
			if (err) { throw logger.error('Could not increment unique item id counter', err) }
			
			var doCallback = blockCallback(bind(this, callback, newItemId), { throwErr: true, fireOnce: true })
			
			for (var propName in itemProperties) {
				var value = itemProperties[propName],
					key = shared.keys.getItemPropertyKey(newItemId, propName),
					mutation = { id: key, op: 'set', args: [value] }
				
				this.mutateItem(mutation, origConnection, doCallback.addBlock())
			}
			
			doCallback.tryNow()
		}))
	}
	
	this.mutateItem = function(mutation, originConnection, callback) {
		var key = mutation.key,
			propName = shared.keys.getKeyInfo(key).property,
			operation = mutation.op,
			args = Array.prototype.slice.call(mutation.args, 0)
			connId = originConnection ? originConnection.getId() : '',
			mutationBuffer = connId.length + connId + JSON.stringify(mutation)
		
		if (connId.length > 9) {
			throw logger.error("Connection ID is longer than 9 digits! Parsing this connection ID won't work")
		}
		
		args.unshift(key)
		logger.log('Apply and publish mutation', operation, args)
		if (callback) { args.push(callback) }
		this._store.handleMutation(operation, args)
		
		// TODO clients should subscribe against pattern channels, 
		//	e.g. for item props *:1@type:* and for prop channels *:#type:*
		//	mutations then come with a single publication channel, 
		//	e.g. :1@type:#type: for a mutation that changes the type of item 1
		// var propChannel = shared.keys.getPropertyChannel(propName)
		
		this._store.publish(key, mutationBuffer)
		// this._store.publish(propChannel, mutationBuffer)
	}
})

