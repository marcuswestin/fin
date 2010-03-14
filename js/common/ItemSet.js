jsio('from common.javascript import Class, bind')
jsio('import common.Publisher')

exports = Class(common.Publisher, function(supr) {
	
	// conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	this.init = function(factory, id, conditions) {
		supr(this, 'init')
		this._store = factory.getStore()
		this._id = id
		this._conditions = conditions
		this._dependants = []
		this._queuedMutation = { add: [], remove: [] }
	}
	
	this.getId = function() { return this._id }
	this.getItems = function(callback) { 
		this._store.getItems(this._id, function(err, itemIds){
			if (err) { throw err }
			callback(itemIds)
		}) 
	}

	this.addDependant = function(callback) { this._dependants.push(callback) }
	this._queueMutation = function(mutation) {
		if (mutation.add) { 
			this._queuedMutation.add = this._queuedMutation.add.concat(mutation.add)
		}
		if (mutation.remove) {
			this._queuedMutation.remove = this._queuedMutation.add.concat(mutation.remove)
		}
		this._flushMutations()
	}
	this.createDelayedMethod('_flushMutations', function() {
		
		for (var i=0, callback; callback = this._dependants[i]; i++) {
			callback(this._queuedMutation)
		}
		this._queuedMutation = { add: [], remove: [] }
	})
	
	// Item set snapshot was loaded - this only gets called on the client side
	this.setSnapshot = function(snapshot) {
		var items = snapshot.items
		this._store.setSnapshot(this._id, items, bind(this, function(err) {
			if (err) { throw err }
			var mutation = { add: items }
			this._queueMutation(mutation)
		}))
	}
	
	// An item updated locally - happens both on client and server side 
	this.handleItemUpdate = function(properties) {
		var itemId = properties._id
		this._store.isInSet(this._id, itemId, bind(this, function(err, isInSet) {
			if (err) { throw err }
			if (isInSet == this._shouldBeInSet(properties)) { return }
			if (isInSet) {
				this._removeFromSet(itemId)
			} else {
				this._addToSet(itemId)
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
	
	// An item updated remotelly - this only gets called on the client side
	this.applyMutation = function(mutation) {
		this._store.removeItems(mutation.remove)
		this._store.addItems(mutation.remove)
		this._queueMutation(mutation)
	}
	
	this._shouldBeInSet = function(properties) {
		for (var i=0, condition; condition = this._conditions[i]; i++) {
			var propertyName = condition[0],
				comparisonOperator = condition[1],
				compareValue = condition[2],
				value = properties[propertyName]
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
