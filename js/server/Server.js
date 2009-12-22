jsio('from common.javascript import Class, map, bind');
jsio('from net.interfaces import Server');
jsio('import .Connection');
jsio('import .Database');
jsio('import common.itemFactory');

var logger = logging.getLogger('Server');
logger.setLevel(0);

exports = Class(Server, function(supr) {

	this.init = function(http) {
		supr(this, 'init', [Connection]);
		this._mutationSubscriptions = {};
		this._uniqueId = 0;
		
		this._database = new Database(http);
	}

	this.getLabelsForUser = function(username) {
		return ['user', 'bug'];
	}

	this.getItemIdsForLabel = function(label) {
		if (label == 'user') {
			return ['6e1295ed6c29495e54cc05947f18c8af'];
		} else if (label == 'bug') {
			return ['b7b3bf9667db2a4c923b882136002fda'];
		}
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
		var item = common.itemFactory.getItem(mutation.id);
		logger.log('handleMutation', mutation.id, JSON.stringify(mutation));
		item.applyMutation(mutation, true);
		var subs = this._mutationSubscriptions[item.getId()];
		for (var key in subs) {
			subs[key](mutation);
		}
	}
	
	this.getItem = function(id, callback) {
		if (common.itemFactory.hasItem(id)) {
			var item = common.itemFactory.getItem(id)
			logger.log('getItem', id, 'from memory', JSON.stringify(item.getProperties()));
			var item = common.itemFactory.getItem(id);
			callback(item);
		} else {
			logger.log('getItem', id, 'from database');
			this._database.getItemData(id, function(properties) {
				
				var id = properties._id;
				var revision = properties._rev;
				var type = properties.type;
				delete properties._id;
				delete properties._rev;
				delete properties.type;
				
				var item = common.itemFactory.getItem(id);
				item.setType(type);
				item.setRevision(revision);
				item.setProperties(properties);
				callback(item);
			});
		}
	}
});

