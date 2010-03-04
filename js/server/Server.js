jsio('from common.javascript import Class, map, bind');
jsio('from net.interfaces import Server');
jsio('import common.itemFactory');

exports = Class(Server, function(supr) {

	this.init = function(database, connectionConstructor) {
		supr(this, 'init', [connectionConstructor]);
		this._mutationSubscriptions = {};
		this._uniqueId = 0;
		this._database = database;
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
		var subId = 'sub' + this._uniqueId++;
		this._mutationSubscriptions[itemId][subId] = callback;
		return subId;
	}
	
	this.handleMutation = function(mutation) {
		var id = mutation._id, item = common.itemFactory.getItem(id);
		logger.log('handleMutation', id, JSON.stringify(mutation));
		item.applyMutation(mutation, true);
		var subs = this._mutationSubscriptions[id];
		for (var key in subs) {
			try {
				subs[key](mutation);				
			} catch (e) {
				logger.error('Error when handling mutation', JSON.stringify(e));
			}
		}
		
		if (this._databaseScheduledWrites[id]) { return }
		this._databaseScheduledWrites[id] = setTimeout(bind(this, function() {
			clearTimeout(this._databaseScheduledWrites[id])
			delete this._databaseScheduledWrites[id]
			logger.log('store item in database', id, JSON.stringify(item._properties));
			this._database.storeItemData(item.getProperties(), bind(this, '_handleItemRevision', item));
		}), 2000)
	}
	
	this.unsubscribeFromItemMutations = function(itemId, subId) {
		delete this._mutationSubscriptions[itemId][subId];
	}

	this._handleItemRevision = function(item, response, error) {
		if (error) {
			logger.warn('could not store item', item.getId(), JSON.stringify(error));
		} else {
			logger.log('stored item and got new revision', response.id, response.rev);
			item.setRevision(response.rev);
		}
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
				item.setSnapshot(data, true)
				callback(item);
			});
		}
	}
});

