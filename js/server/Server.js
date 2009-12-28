jsio('from common.javascript import Class, map, bind');
jsio('from net.interfaces import Server');
jsio('import .Connection');
jsio('import .Database');
jsio('import common.itemFactory');

var logger = logging.getLogger(jsio.__path);
logger.setLevel(0);

exports = Class(Server, function(supr) {

	this.init = function(database) {
		supr(this, 'init', [Connection]);
		this._mutationSubscriptions = {};
		this._uniqueId = 0;
		this._database = database;
		this._databaseWriteFrequency = 1; // write on every update
	}
	
	this.authenticate = function(email, password, callback) {
		this._database.getItemData(email, function(userDescription, error){
			if (error) {
				callback(false, 'That email is not in our database');
			} else if (userDescription.properties.password != password) {
				callback(false, 'That password isn\'t correct');
			} else {
				callback(userDescription.properties.labels);
			}
		})
	}

	this.getLabelList = function(label, callback) {
		this._database.getList(label, function(response) {
			var list = map(response.rows, function(row) { return row.value });
			callback(list);
		});
	}

	this.subscribeToItemMutations = function(item, callback) {
		var id = item.getId();
		if (!this._mutationSubscriptions[id]) { this._mutationSubscriptions[id] = {}; }
		logger.log('subscribeToItemMutations', this._mutationSubscriptions[id].length, 'subscribers');
		var subId = 'sub' + this._uniqueId++;
		this._mutationSubscriptions[id][subId] = callback;
		return subId;
	}
	
	this.handleMutation = function(mutation) {
		var item = common.itemFactory.getItem(mutation._id);
		logger.log('handleMutation', mutation._id, item._mutationCount, JSON.stringify(mutation));
		item.applyMutation(mutation, true);
		var subs = this._mutationSubscriptions[item.getId()];
		for (var key in subs) {
			subs[key](mutation);
		}
		if (item._mutationCount++ % this._databaseWriteFrequency == 0) {
			logger.log('store item changes to database for item', item.getId(), JSON.stringify(item._properties));
			this._database.storeItemData(item.asObject(), bind(this, '_handleItemRevision', item));
		}
	}

	this._handleItemRevision = function(item, response, error) {
		if (error) {
			logger.warn('could not store item', item.getId(), JSON.stringify(error));
		} else {
			logger.log('stored item', item.getId());
			item._rev = response._rev;
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
	
	this.createLabel = function(labelName, mapCode, filterCode, callback) {
		var views = { label: { map: mapCode } };
		var filters = { label: filterCode };
		var id = '_design/' + labelName;
		this._database.storeItemData({ _id: id, views: views, filters: filters }, function(respone){
			callback([labelName]);
		});
	}
	
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

