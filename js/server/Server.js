jsio('from common.javascript import Class, map, bind');
jsio('from net.interfaces import Server');
jsio('import common.itemFactory');

exports = Class(Server, function(supr) {

	this.init = function(database, connectionConstructor) {
		supr(this, 'init', [connectionConstructor]);
		this._mutationSubscriptions = {};
		this._uniqueId = 0;
		this._database = database;
		this._databaseWriteFrequency = 1; // write on every update
		this._databaseScheduledWrites = {}
	}
	
	// this.authenticate = function(email, password, callback) {
	// 	this._database.getItemData(email, function(userDescription, error){
	// 		logger.log("Checking credentials for", email, "found", JSON.stringify(userDescription));
	// 		if (error) {
	// 			callback(false, 'That email is not in our database');
	// 		} else if (userDescription.properties.password != password) {
	// 			callback(false, 'That password isn\'t correct');
	// 		} else {
	// 			callback(userDescription.properties.labels);
	// 		}
	// 	})
	// }

	// this.getLabelList = function(label, callback) {
	// 	this._database.getList(label, function(response) {
	// 		var list = map(response.rows, function(row) { return row.value });
	// 		callback(list);
	// 	});
	// }

	this.subscribeToItemMutations = function(item, callback) {
		var itemId = item.getId();
		if (!this._mutationSubscriptions[itemId]) { this._mutationSubscriptions[itemId] = {}; }
		logger.log('subscribeToItemMutations', this._mutationSubscriptions[itemId].length, 'subscribers');
		var subId = 'sub' + this._uniqueId++;
		this._mutationSubscriptions[itemId][subId] = callback;
		return subId;
	}
	
	this.handleMutation = function(mutation) {
		var item = common.itemFactory.getItem(mutation._id);
		logger.log('handleMutation', mutation._id, item._mutationCount, JSON.stringify(mutation));
		item.applyMutation(mutation, true);
		var subs = this._mutationSubscriptions[item.getId()];
		for (var key in subs) {
			try {
				subs[key](mutation);				
			} catch (e) {
				logger.error('Error when handling mutation', JSON.stringify(e));
			}
		}
		if (item._mutationCount++ % this._databaseWriteFrequency == 0) {
			var id = item.getId()
			logger.log('store item changes to database for item', id, JSON.stringify(item._properties));
			if (this._databaseScheduledWrites[id]) { return }
			this._databaseScheduledWrites[id] = setTimeout(bind(this, function() {
				clearTimeout(this._databaseScheduledWrites[id])
				delete this._databaseScheduledWrites[id]
				this._database.storeItemData(item.asObject(), bind(this, '_handleItemRevision', item));
			}, 2000))
		}
	}
	
	this.unsubscribeFromItemMutations = function(itemId, subId) {
		delete this._mutationSubscriptions[itemId][subId];
	}

	this._handleItemRevision = function(item, response, error) {
		if (error) {
			logger.warn('could not store item', item.getId(), JSON.stringify(error));
		} else {
			logger.log('stored item and got new revision', response.id, response.rev);
			item._rev = response.rev;
		}
	}
	
	this.createItem = function(type, callback) {
		this._database.createItem(type, bind(this, function(response, error) {
			if (error) {
				logger.warn('could not create item', type, JSON.stringify(error));
			} else {
				logger.log('created item', type, response._id);
				this.getItem(response._id, callback);
			}
		}));
	}
	
  // this.createLabel = function(userId, labelName, mapCode, filterCode, callback) {
  //  var views = { label: { map: mapCode } };
  //  var filters = { label: filterCode };
  //  var id = '_design/' + labelName;
  //  this._database.storeItemData({ _id: id, views: views, filters: filters }, bind(this, function(respone){
  //    this._database.getItemData(userId, bind(this, function(user) {
  //      user.properties.labels = user.properties.labels.concat(labelName);
  //      this._database.storeItemData(user, function(response){
  //        callback(labelName);
  //      });
  //    }));
  //  }));
  // }
	
	this.getItem = function(id, callback) {
		if (common.itemFactory.hasItem(id)) {
			var item = common.itemFactory.getItem(id);
			logger.log('get item from memory', id, JSON.stringify(item._properties));
			callback(item);
		} else {
			logger.log('get item from database', id);
			this._database.getItemData(id, function(data) {
				logger.log('retrieved item from database', JSON.stringify(data));
				var item = common.itemFactory.getItem(data._id);
				item.setType(data.type);
				item._rev = data._rev;
				item._properties = data.properties;
				item._mutationCount = 0;
				callback(item);
			});
		}
	}
});

