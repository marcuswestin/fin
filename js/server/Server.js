jsio('from common.javascript import Class, map');
jsio('from net.interfaces import Server');
jsio('import .Connection');
jsio('import common.itemFactory');
jsio('import .rubberData as __RubberData');

var logger = logging.getLogger('Server');
logger.setLevel(0);

exports = Class(Server, function(supr) {
	
	this.init = function() {
		supr(this, 'init', [Connection]);
		this._itemSubscriptions = {};
		this._uniqueId = 0;
		
		// Dev rubber data
		jsio('import common.Item');
		common.itemFactory._items 
		
		for (var i=0, itemData; itemData = __RubberData.itemData[i]; i++) {
			var item = new common.Item(itemData.id);
			item._type = itemData.type;
			item._properties = itemData.properties;
			common.itemFactory._items[itemData.id] = item;
		}
	}
	
	this.getLabelsForUser = function(username) {
		return __RubberData.userToLabel[username];
	}
	
	this.getItemIdsForLabel = function(label) {
		return __RubberData.labelToItemIds[label];
	}
	
	
	// this.subscribeToItemMutations = function(itemId, callback) {
	this.subscribeToItemPropertyChange = function(itemId, callback) {
		if (!this._itemSubscriptions[itemId]) { this._itemSubscriptions[itemId] = {}; }
		logger.log('subscribeToItemPropertyChange', this._itemSubscriptions[itemId].length, 'subscribers')
		var subId = 'sub' + this._uniqueId++;
		this._itemSubscriptions[itemId][subId] = callback;
		return subId;
	}
	
	this.unsubscribeFromItemMutations = function(itemId, subId) {
		delete this._itemSubscriptions[itemId][subId];
	}
	
	this.queueMutation = function(mutation) {
		
	}
	
	// DEV - should be using mutations instead
	this.dispatchItemPropertyUpdated = function(itemId, propertyName, propertyValue) {
		var item = common.itemFactory.getItem(itemId);
		item.updateProperty(propertyName, propertyValue);
		var subs = this._itemSubscriptions[itemId];
		logger.log('dispatchItemPropertyUpdated', itemId, propertyName, '=', propertyValue);
		for (var key in subs) {
			subs[key](itemId, propertyName, propertyValue);
		}
	}
	
	this.getItemSnapshot = function(id) {
		var item = common.itemFactory.getItem(id);
		logger.log('GET SNAPSHOT', JSON.stringify(item.getProperties()))
		return { id: id, type: item.getType(), properties: item.getProperties() }
	}
});

