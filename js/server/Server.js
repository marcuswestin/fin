jsio('from common.javascript import Class, map, bind');
jsio('from net.interfaces import Server');
jsio('import server.Connection');
jsio('import common.itemFactory');
jsio('import common.ItemSetFactory');
jsio('import common.SubscriptionPool');

exports = Class(Server, function(supr) {

	this.init = function(database, itemSetStore) {
		supr(this, 'init', [server.Connection]);
		this._uniqueId = 0;
		this._database = database;
		this._itemSetFactory = new common.ItemSetFactory(itemSetStore);
		this._databaseScheduledWrites = {}
		
		this._itemSubscriberPool = new common.SubscriptionPool()
		this._itemSetSubscriberPool = new common.SubscriptionPool()
	}
	
	this.subscribeToItemMutations = function(itemId, subCallback, snapshotCallback) {
		var subId = this._itemSubscriberPool.add(itemId, subCallback)
		this._getItemSnapshot(itemId, snapshotCallback)
		return subId
	}
	
	this.subscribeToItemSetMutations = function(id, subCallback, snapshotCallback) {
		var shouldSubscribe = !this._itemSetFactory.hasItemSet(id)
		var itemSet = this._itemSetFactory.getItemSetById(id)
		if (shouldSubscribe) {
			itemSet.subscribe('Mutated', bind(this, '_onItemSetMutated'))
		}
		var subId = this._itemSetSubscriberPool.add(id, subCallback)
		itemSet.getItems(function(itemIds){
			var snapshot = { _id: id, items: itemIds }
			snapshotCallback(snapshot)
		})
		return subId
	}
	
	this._onItemSetMutated = function(mutation) {
		var subs = this._itemSetSubscriberPool.get(mutation._id)
		this._executeMutationSubs(subs, mutation)
	}
	
	this.handleMutation = function(mutation) {
		common.itemFactory.handleMutation(mutation)
		var subs = this._itemSubscriberPool.get(mutation._id)
		this._executeMutationSubs(subs, mutation)
		this._scheduledItemWrite(mutation._id)
	}
	
	this._executeMutationSubs = function(subs, mutation) {
		for (var key in subs) {
			try { subs[key](mutation); } 
			catch (e) { logger.error('Error when handling mutation', JSON.stringify(e)); }
		}
	}
	
	// TODO This method should go inside each item, which should use its own item store. couch for server, local storage for browser
	this._scheduledItemWrite = function(id) {
		var item = common.itemFactory.getItem(id)
		if (this._databaseScheduledWrites[id]) { return }
		this._databaseScheduledWrites[id] = setTimeout(bind(this, function() {
			clearTimeout(this._databaseScheduledWrites[id])
			delete this._databaseScheduledWrites[id]
			logger.log('store item in database', id);
			logger.debug('item data into database', JSON.stringify(item._properties));
			this._database.storeItemData(item.getProperties(), bind(this, '_handleItemRevision', item));
		}), 2000)
	}
	
	
	this.unsubscribeFromItemMutations = function(itemId, subId) {
		this._itemSubscriberPool.remove(itemId, subId)
	}

	this._handleItemRevision = function(item, err, response) {
		if (err) {
			logger.warn('could not store item', item.getId(), JSON.stringify(err));
		} else {
			logger.debug('stored item and got new revision', response.id, response.rev);
			item.setRevision(response.rev);
		}
	}
	
	this._getItemSnapshot = function(id, callback) {
		if (common.itemFactory.hasItem(id)) {
			var item = common.itemFactory.getItem(id);
			logger.log('get item from memory', id);
			logger.debug('item data from memory', JSON.stringify(item.getProperties()))
			callback(item.getProperties());
		} else {
			logger.log('get item from database', id);
			this._database.getItemData(id, function(err, data) {
				if (err) {
					logger.warn("Could not retrieve item from db", id, err)
					return;
				}
				logger.log('retrieved item from database');
				logger.debug('item data from database', JSON.stringify(data))
				var item = common.itemFactory.getItem(data._id);
				item.setSnapshot(data, true)
				callback(item.getProperties());
			});
		}
	}
});

