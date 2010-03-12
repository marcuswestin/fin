jsio('from common.javascript import Class, Publisher, bind')
jsio('import common.Item')
jsio('import common.Publisher')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(itemStore) {
		supr(this, 'init')
		this._store = itemStore
		this._items = {}
		this._snapshots = {}
		this._snapshotCallbacks = {}
	}
	
	this.getStore = function() { return this._store }
	
	this.handleItemSnapshot = function(snapshot, callback) {
		logger.log('Loading snapshot', snapshot._id, snapshot)
		var item = this.getItem(snapshot._id)
		item.setSnapshot(snapshot)
		if (this._snapshotCallbacks[snapshot._id]) {
			var callbacks = this._snapshotCallbacks[snapshot._id]
			for (var i=0, callback; callback = callbacks[i]; i++) {
				callback()
			}
		}
	}
	
	this.handleMutation = function(mutation) {
		logger.log('handleMutation', JSON.stringify(mutation))
		var item = this.getItem(mutation._id)
		item.applyMutation(mutation)
		
		this._publish('ItemPropertyUpdated', item, mutation.property)
	}
	
	this.getItem = function(id, callback) {
		if (callback) {
			if (this._snapshots[id]) { 
				callback() 
			} else if (this._snapshotCallbacks[id]) {
				this._snapshotCallbacks[id].push(callback)
			} else {
				this._snapshotCallbacks[id] = [callback]
			}
		}
		if (this._items[id]) { return this._items[id] }
		logger.log("Create item", id)
		this._items[id] = new common.Item(this, id)
		this._publish('ItemCreated', this._items[id])
		return this._items[id]
	}
	
	this.getChainedItem = function(item, propertyChain) {
		propertyChain = propertyChain.slice(0)
		var referencePropertyName = propertyChain.shift()
		var chainItemId = item.getProperty(referencePropertyName)
		var nextItem = this.getItem(chainItemId)
		if (propertyChain.length == 0) {
			return nextItem
		} else {
			return this.getChainedItem(nextItem, propertyChain)
		}
	}
	
	this.hasItem = function(id) {
		return !!this._items[id]
	}
	
})
