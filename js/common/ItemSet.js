jsio('from common.javascript import Class, bind')
jsio('import common.Publisher')

exports = Class(common.Publisher, function(supr) {
	
	// conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	this.init = function(factory, id, conditions) {
		supr(this, 'init')
		this._store = factory.getStore()
		this._id = id
		this._conditions = conditions
	}
	
	this.getId = function() { return this._id }
	this.getItems = function(callback) { 
		this._store.getItems(this._id, function(err, itemIds){
			if (err) { throw err }
			callback(itemIds)
		}) 
	}
	
	this.handleItemUpdate = function(item, propertyName) {
		var itemId = item.getId(),
			shouldBeInSet = this._shouldBeInSet(item)
		this._store.isInSet(this._id, itemId, bind(this, function(err, isInSet){
			if (err) { throw err }
			if (isInSet == shouldBeInSet) { return }
			if (isInSet) {
				this._removeFromSet(itemId)
			} else {
				this._addToSet(itemId)
			}
		}))
	}
	
	this._shouldBeInSet = function(item) {
		for (var i=0, condition; condition = this._conditions[i]; i++) {
			var propertyName = condition[0],
				comparisonOperator = condition[1],
				compareValue = condition[2],
				value = item.getProperty(propertyName)
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
	
	this._removeFromSet = function(itemId) {
		this._store.removeFromSet(this._id, itemId, bind(this, function(err, position) {
			if (err) { throw err }
			this._publish('Mutated', { _id: this._id, remove: itemId })
		}))
	}
	
	this._addToSet = function(itemId) {
		this._store.addToSet(this._id, itemId, bind(this, function(err, position) {
			if (err) { throw err }
			this._publish('Mutated', { _id: this._id, add: itemId })
		}))
	}
})
