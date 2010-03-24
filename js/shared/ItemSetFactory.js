jsio('from shared.javascript import Class, Publisher, bind')
jsio('import shared.Publisher')
jsio('import shared.ItemSet')

exports = Class(shared.Publisher, function(supr) {
	
	this.init = function(itemFactory, store) {
		supr(this, 'init')
		this._itemSets = {}
		this._itemSetsByProperty = {}
		this._store = store
		
		itemFactory.subscribe('ItemCreated', bind(this, '_onItemCreated'))
		itemFactory.subscribe('ItemPropertyUpdated', bind(this, '_onItemPropertyUpdated'))
	}
	
	this.hasItemSet = function(id) { return !!this._itemSets[id] }
	
	this.getItemSet = function(id) {
		if (this._itemSets[id]) { return this._itemSets[id] }
		var conditions = JSON.parse(id)
		for (var i=0, condition; condition = conditions[i]; i++) {
			this.addPropertyDependance(condition[0], id)
		}
		return this._itemSets[id] = new shared.ItemSet(this, id, conditions)
	}
	
	this.addPropertyDependance = function(property, itemSetId, checkIfExists) {
		if (!this._itemSetsByProperty[property]) { this._itemSetsByProperty[property] = [] }
		if (checkIfExists) {
			var dependantSets = this._itemSetsByProperty[property]
			for (var i=0, anItemSetId; anItemSetId = dependantSets[i]; i++) {
				// We are already registered to this property - return
				if (anItemSetId == itemSetId) { return }
			}
		}
		this._itemSetsByProperty[property].push(itemSetId)
	}
	
	this.registerPropertyReduce = function(reductionId, itemSetId, property) {
		if (!property) { property = reductionId.split(':')[1] }
		this.addPropertyDependance(property, itemSetId, true)
		this._publish('ReductionAdded', itemSetId, reductionId)
	}
	
	this.getStore = function() { return this._store }
	
	// Return in alphabetical order of the property name. 
	// If property name is equal, order by alpha order of the property value
	// If property value is equal, order by alhpa order of the conditional (=, <, >, ...)
	// e.g. conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	// 		returns 'age>15:age<18:name=marcus'
	this.getIdFromConditions = function(conditions) {
		conditions.sort(function(a, b){
			if (a[0] != b[0]) { return a[0] < b[0] ? -1 : 1 }
			else if (a[2] != b[2]) { return a[1] < b[1] ? -1 : 1 }
			else if (a[1] != b[1]) { return a[1] < b[1] ? -1 : 1 }
			else { return 0 }
		})
		return JSON.stringify(conditions);
	}
	
	this._onItemCreated = function(item) {
		var properties = item.getData()
		for (var propertyName in properties) {
			this._onItemPropertyUpdated(item, propertyName)
		}
	}
	
	this._onItemPropertyUpdated = function(item, property, oldValue) {
		var dependentSets = this._itemSetsByProperty[property]
		if (!dependentSets) { return }
		for (var i=0, itemSetId; itemSetId = dependentSets[i]; i++) {
			this._itemSets[itemSetId].handleItemUpdate(item.getData(), property, oldValue)
		}
	}
	
	this.handleMutation = function(mutation) {
		var itemSet = this._itemSets[mutation._id]
		itemSet.applyMutation(mutation)
	}
})
