jsio('from common.javascript import Class, map, bind')
jsio('from net.interfaces import Server')
jsio('import server.Connection')
jsio('import common.ItemFactory')
jsio('import common.ItemSetFactory')
jsio('import common.SubscriptionPool')

exports = Class(Server, function(supr) {

	this.init = function(itemStore, itemSetStore) {
		supr(this, 'init', [server.Connection])
		this._uniqueId = 0
		this._itemStore = itemStore
		this._itemFactory = new common.ItemFactory(itemStore)
		this._itemSetFactory = new common.ItemSetFactory(this._itemFactory, itemSetStore)
		this._databaseScheduledWrites = {}
		
		this._itemSubscriberPool = new common.SubscriptionPool()
		this._itemSetSubscriberPool = new common.SubscriptionPool()
	}
	
	this.exists = function(itemId, callback) {
		this._itemStore.exists(itemId, callback)
	}
	
	this.createItem = function(itemData, callback) {
		this._itemStore.storeItemData(itemData, bind(this, function(err, result) {
			if (err) { throw err }
			itemData._id = result.id
			itemData._rev = result.rev
			var item = this._itemFactory.getItem(itemData)
			callback(item)
		}));
	}
	
	this.subscribeToItemMutations = function(itemId, subCallback, snapshotCallback) {
		var subId = this._itemSubscriberPool.add(itemId, subCallback)
		this._getItemSnapshot(itemId, snapshotCallback)
		return subId
	}
	
	this.subscribeToItemSet = function(id, callback) {
		var isNew = !this._itemSetFactory.hasItemSet(id)
		var itemSet = this._itemSetFactory.getItemSet(id)
		if (isNew) {
			itemSet.subscribe('Mutated', bind(this, '_onItemSetMutated'))
			this._itemStore.getAllItems(bind(this, function(itemProperties) {
				itemSet.handleItemUpdate(itemProperties)
			}))
		}
		var subId = this._itemSetSubscriberPool.add(id, callback)
		itemSet.getItems(function(itemIds){
			callback({ _id: id, add: itemIds })
		})
		return subId
	}
	
	this._onItemSetMutated = function(mutation) {
		var subs = this._itemSetSubscriberPool.get(mutation._id)
		this._executeMutationSubs(subs, mutation)
	}
	
	this.handleMutation = function(mutation) {
		this._itemFactory.handleMutation(mutation)
		var subs = this._itemSubscriberPool.get(mutation._id)
		this._executeMutationSubs(subs, mutation)
	}
	
	this._executeMutationSubs = function(subs, mutation) {
		for (var key in subs) {
			try { subs[key](mutation) } 
			catch (e) { logger.error('Error when handling mutation', JSON.stringify(e)) }
		}
	}
	
	this.unsubscribeFromItemMutations = function(itemId, subId) {
		this._itemSubscriberPool.remove(itemId, subId)
	}

	this._getItemSnapshot = function(id, callback) {
		if (this._itemFactory.hasItem(id)) {
			var item = this._itemFactory.getItem(id)
			logger.log('retrieved item from memory', id)
			logger.debug('item data from memory', JSON.stringify(item.getData()))
			callback(item.getData())
		} else {
			this._itemStore.getItemData(id, bind(this, function(err, data) {
				if (err) {
					logger.warn("Could not retrieve item from db", id, err)
					return
				}
				logger.log('retrieved item from database', id)
				logger.debug('item data from database', JSON.stringify(data))
				var item = this._itemFactory.getItem(data._id)
				item.setSnapshot(data, true)
				callback(item.getData())
			}))
		}
	}
})

