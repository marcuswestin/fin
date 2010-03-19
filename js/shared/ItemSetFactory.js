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
		
		var conditions = this._getConditionsFromId(id)
		this._itemSets[id] = new shared.ItemSet(this, id, conditions)
		
		for (var i=0, condition; condition = conditions[i]; i++) {
			var propName = condition[0]
			if (!this._itemSetsByProperty[propName]) { this._itemSetsByProperty[propName] = [] }
			this._itemSetsByProperty[propName].push(this._itemSets[id])
		}
		return this._itemSets[id]
	}
	
	this.getStore = function() { return this._store }
	
	this.getItemSetsByDependency = function(propertyName) {
		return this._itemSetsByProperty[propertyName]
	}
	
	// Return in alphabetical order of the property name. 
	// If property name is equal, order by alpha order of the property value
	// If property value is equal, order by alhpa order of the conditional (=, <, >, ...)
	// e.g. conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	// 		returns 'age>15:age<18:name=marcus'
	this.getIdFromConditions = function(conditions) {
		var id = ''
		conditions.sort(function(a, b){
			if (a[0] != b[0]) { return a[0] < b[0] ? -1 : 1 }
			else if (a[2] != b[2]) { return a[1] < b[1] ? -1 : 1 }
			else if (a[1] != b[1]) { return a[1] < b[1] ? -1 : 1 }
			else { return 0 }
		})
		var idArr = []
		for (var i=0, condition; condition = conditions[i]; i++) {
			idArr.push(condition.join(''))
		}
		return idArr.join(';')
	}
	
	this._conditionRegexp = /([^<=>]*)([<=>])([^<=>]*)/ // a string followed by <, > or =, followed by another string
	this._getConditionsFromId = function(id) {
		var conditions = []
		var list = id.split(';')
		for (var i=0, listItem; listItem = list[i]; i++) {
			var match = listItem.match(this._conditionRegexp) // "name=marcus" => ["name=marcus", "name", "=", "marcus"]
			conditions.push([match[1], match[2], match[3]])
		}
		return conditions
	}
	
	this._onItemCreated = function(item) {
		var properties = item.getData()
		for (var propertyName in properties) {
			this._onItemPropertyUpdated(item, propertyName)
		}
	}
	
	this._onItemPropertyUpdated = function(item, propertyName) {
		var dependentSets = this._itemSetsByProperty[propertyName]
		if (!dependentSets) { return }
		for (var i=0, itemSet; itemSet = dependentSets[i]; i++) {
			itemSet.handleItemUpdate(item.getData())
		}
	}
	
	this.handleMutation = function(mutation) {
		var itemSet = this._itemSets[mutation._id]
		itemSet.applyMutation(mutation)
	}
})
