jsio('from common.javascript import Class, Publisher, bind')
jsio('import common.Publisher')
jsio('import common.itemFactory')
jsio('import common.ItemSet')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(store) {
		supr(this, 'init')
		this._itemSets = {}
		this._itemSetsByProperty = {}
		this._store = store
		
		common.itemFactory.subscribe('ItemPropertyUpdated', bind(this, '_onItemPropertyUpdated'));
	}
	
	this.hasItemSet = function(id) { return !!this._itemSets[id] }
	
	this.getItemSetByConditions = function(conditions) {
		var id = this.getIdFromConditions(conditions)
		return this.getItemSetById(id)
	}
	
	this.getItemSetById = function(id) {
		if (this._itemSets[id]) { return this._itemSets[id] }
		
		var conditions = this._getConditionsFromId(id)
		this._itemSets[id] = new common.ItemSet(this, id, conditions)
		
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
	
	this._onItemPropertyUpdated = function(item, propertyName) {
		var dependentSets = this._itemSetsByProperty[propertyName]
		if (!dependentSets) { return }
		for (var i=0, itemSet; itemSet = dependentSets[i]; i++) {
			itemSet.handleItemUpdate(item)
		}
	}
	
})
