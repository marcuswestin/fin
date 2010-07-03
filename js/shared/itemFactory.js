// jsio('from shared.javascript import Class, Publisher, bind')
// jsio('import shared.Item')
// jsio('import shared.Publisher')
// 
// exports = Class(shared.Publisher, function(supr) {
// 	
// 	this.init = function(itemStore) {
// 		supr(this, 'init')
// 		this._store = itemStore
// 		this._items = {}
// 	}
// 	
// 	this.getStore = function() { return this._store }
// 	
// 	this.handleItemSnapshot = function(snapshot, callback) {
// 		logger.log('Loading snapshot', snapshot._id, snapshot)
// 		var item = this.getItem(snapshot._id)
// 		item.setSnapshot(snapshot)
// 	}
// 	
// 	this.handleMutation = function(mutation, silent) {
// 		logger.log('handleMutation', silent, mutation)
// 		if (!silent) { this._publish('ItemMutating', mutation) }
// 		
// 		var item = this.getItem(mutation._id),
// 			property = mutation.property,
// 			oldValue = item.getProperty(property),
// 			changed = item.applyMutation(mutation)
// 		
// 		if (!silent && changed) {
// 			this._publish('ItemPropertyUpdated', item, property, oldValue)
// 		}
// 	}
// 	
// 	this.getItem = function(itemData) {
// 		var id = (typeof itemData == 'string' ? itemData : itemData._id)
// 		if (this._items[id]) { return this._items[id] }
// 		logger.log("Create item", id)
// 		this._items[id] = new shared.Item(this, itemData)
// 		this._publish('ItemCreated', this._items[id])
// 		return this._items[id]
// 	}
// 	
// 	this.getChainedItem = function(item, propertyChain) {
// 		propertyChain = propertyChain.slice(0)
// 		var referencePropertyName = propertyChain.shift()
// 		var chainItemId = item.getProperty(referencePropertyName)
// 		var nextItem = this.getItem(chainItemId)
// 		if (propertyChain.length == 0) {
// 			return nextItem
// 		} else {
// 			return this.getChainedItem(nextItem, propertyChain)
// 		}
// 	}
// 	
// 	this.hasItem = function(id) {
// 		return !!this._items[id]
// 	}
// 	
// })
