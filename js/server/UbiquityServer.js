jsio('from common.javascript import Class');
jsio('from net.interfaces import Server');
jsio('import .UbiquityConnection');
jsio('import common.itemFactory');

var logger = logging.getLogger('UbiquityServer');
logger.setLevel(0);

exports = Class(Server, function(supr) {
	
	this.init = function() {
		supr(this, 'init', [UbiquityConnection]);
		this._itemSubscriptions = {};
		this._uniqueId = 0;
		
		// Dev rubber data
		jsio('import common.Item');
		common.itemFactory._items = {
			1: new common.Item(1, 'Person', { name: 'Marcus', age: 23 }),
			2: new common.Item(2, 'Person', { name: 'Jon', age: 26 })
		}
		
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
		var subs = this._itemSubscriptions[itemId];
		logger.log('dispatchItemPropertyUpdated', itemId, propertyName, '=', propertyValue);
		for (var key in subs) {
			subs[key](itemId, propertyName, propertyValue);
		}
	}
	
	this.getItemSnapshot = function(id) {
		var item = common.itemFactory.getItem(id);
		return { id: id, type: item.getType(), properties: item.getProperties() }
	}
});

