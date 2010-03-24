jsio('from shared.javascript import Class, bind')
jsio('import shared.Publisher')

exports = Class(shared.Publisher, function(supr) {
	
	this._initialReductionValues = {
		'sum': 0,
		'count': {} // count occurances of each value - not yet supported
	}

	// conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	this.init = function(factory, id, conditions) {
		supr(this, 'init')
		this._factory = factory
		this._store = this._factory.getStore()
		this._id = id
		this._conditions = conditions
		this._dependants = []
		this._queuedMutation = { add: [], remove: [], reduce: [] }
		this._reductions = {}
		this._reductionValues = {}
	}
	
	this.getId = function() { return this._id }
	this.getItems = function(callback) { 
		this._store.getItems(this._id, function(err, itemIds){
			if (err) { throw err }
			callback(itemIds)
		})
	}
	
	this.sum = function(property, callback) { this._reduce('sum', property, callback) } 
	
	// Called on client
	this._reduce = function(operation, property, callback) {
		var reductionId = operation + ':' + property
		if (typeof this._reductionValues[reductionId] != 'undefined') { 
			// TODO perhpas we should just push another dependant here?
			throw logger.error("Already reducing", reductionId) 
		}
		this._initializeReduction(reductionId, operation, property)
	
		this._dependants.push(bind(this, function() {
			callback(null, this._reductionValues[reductionId]) // TODO what should the mutation be here?
		}))
	}
	
	// Called on server
	this.registerReductionById = function(reductionId) {
		// Check if we are already performing this reduction
		if (typeof this._reductionValues[reductionId] != 'undefined') { return } 
		var data = reductionId.split(':'),
			operation = data[0],
			property = data[1]
		this._initializeReduction(reductionId, operation, property)
	}
	
	this._initializeReduction = function(reductionId, operation, property) {
		if (!this._reductions[property]) { this._reductions[property] = [] }
		this._reductions[property].push(operation)
		this._reductionValues[reductionId] = this._initialReductionValues[operation]
		this._factory.registerPropertyReduce(reductionId, this._id, property)
	}
	
	this.addDependant = function(callback) { 
		this._dependants.push(callback)
		this.getItems(function(itemIds) {
			callback({ add: itemIds })
		})
	}
	this._queueMutation = function(mutation) {
		if (mutation.add) { 
			this._queuedMutation.add = this._queuedMutation.add.concat(mutation.add)
		}
		if (mutation.remove) {
			this._queuedMutation.remove = this._queuedMutation.remove.concat(mutation.remove)
		}
		if (mutation.reduce) {
			this._queuedMutation.reduce = this._queuedMutation.reduce.concat(mutation.reduce)
		}
		this._flushMutations()
	}
	this.createDelayedMethod('_flushMutations', function() {
		for (var i=0, reduction; reduction = this._queuedMutation.reduce[i]; i++) {
			this._reductionValues[reduction[0]] = reduction[1]
		}
		
		for (var i=0, callback; callback = this._dependants[i]; i++) {
			callback(this._queuedMutation)
		}
		this._queuedMutation = { add: [], remove: [], reduce: [] }
	})
	
	// An item updated locally - happens both on client and server side 
	this.handleItemUpdate = function(data, changedProperty, oldValue) {
		var itemId = data._id
		// TODO The changed property may have been a reduce. We should only test the condition who's property just changed
		this._store.isInSet(this._id, itemId, bind(this, function(err, isInSet) {
			if (err) { throw err }

			if (isInSet == this._shouldBeInSet(data)) {
				if (isInSet && changedProperty) { // Item was in and stayed in set, but reduce property may have changed
					this._updateReductions(changedProperty, oldValue, data[changedProperty])
				}
			} else if (isInSet) {
				this._removeFromSet(itemId)
				for (var property in data) {
					this._updateReductions(property, data[property], undefined)
				}
			} else {
				this._addToSet(itemId)
				for (var property in data) {
					this._updateReductions(property, undefined, data[property])
				}
			}
		}))
	}
	
	// An item was removed locally - happens both client and server side
	this._removeFromSet = function(itemId) {
		this._store.removeFromSet(this._id, itemId, bind(this, function(err, position) {
			if (err) { throw err }
			var mutation = { _id: this._id, remove: itemId }
			this._publish('Mutated', mutation)
			// TODO Maybe there should only be dependants, and no publications
			this._queueMutation(mutation)
		}))
	}
	
	// An item was added locally - happens both client and server side
	this._addToSet = function(itemId) {
		this._store.addToSet(this._id, itemId, bind(this, function(err, position) {
			if (err) { throw err }
			var mutation = { _id: this._id, add: itemId }
			this._publish('Mutated', mutation)
			// TODO Maybe there should only be dependants, and no publications
			this._queueMutation(mutation)
		}))
	}
	
	this._updateReductions = function(property, fromValue, toValue) {
		logger.info("Update reductions for", property)
		if (!this._reductions[property] || this._reductions[property].length == 0) { return }
		for (var i=0, operation; operation = this._reductions[property][i]; i++) {
			var id = operation + ':' + property,
				mutation = { _id: this._id, reduce: [] }
			switch (operation) {
				case 'sum':
					if (typeof fromValue == 'undefined') { fromValue = 0 } // item added
					if (typeof toValue == 'undefined') { toValue = 0 } // item removed
					this._reductionValues[id] += (toValue - fromValue)
					break;
				case 'count':
					var counts = this._reductionValues[id]
					// TODO Must publish reduction mutation of old value as well
					if (typeof fromValue != 'undefined') { counts[fromValue] -= 1 } // only if item was not just added
					if (typeof toValue != 'undefined') {
						if (!counts[value]) { counts[value] = 0 }
						counts[value] += 1
					}
					break;
			}
			mutation.reduce.push([id, this._reductionValues[id]])
		}
		logger.info('Mutating item set reductions', mutation)
		this._publish('Mutated', mutation)
		// TODO Maybe there should only be dependants, and no publications
		this._queueMutation(mutation)
	}
	
	// TODO this is ghetto and inefficient. Happens when a new client subscribes to an item set's reduction
	this.getReductions = function() {
		var reductions = []
		for (var key in this._reductionValues) {
			reductions.push([ key, this._reductionValues[key] ])
		}
		return reductions
	}
	
	// An item updated remotelly - this only gets called on the client side
	this.applyMutation = function(mutation) {
		var block = {
			remove: !!mutation.remove,
			add: !!mutation.add,
			reduce: !!mutation.reduce
		}
		function onStored(operation) {
			block[operation] = false
			if (block.add || block.remove) { return }
			this._queueMutation(mutation)
		}
		if (mutation.remove) { this._store.removeFromSet(this._id, mutation.remove, 
			bind(this, onStored, 'remove')) }
		if (mutation.add) { this._store.addToSet(this._id, mutation.add, 
			bind(this, onStored, 'add')) }
		// TODO Store and block on mutation reductions
		if (mutation.reduce) { onStored.call(this, 'reduce') }
	}
	
	this._shouldBeInSet = function(data) {
		for (var i=0, condition; condition = this._conditions[i]; i++) {
			var propertyName = condition[0],
				comparisonOperator = condition[1],
				compareValue = condition[2],
				value = data[propertyName]
			switch (comparisonOperator) {
				case '=':
					if (value != compareValue) { return false }
					continue
				case '<':
					if (value >= compareValue) { return false }
					continue
				case '>':
					if (value <= compareValue) { return false }
					continue
				default:
					throw new Error("Unknown comparison operator " + comparisonOperator)
			}
		}
		return true
	}
})
