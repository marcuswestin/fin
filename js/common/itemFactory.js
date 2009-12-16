jsio('from common.javascript import Singleton, bind');
jsio('import common.Item');

var logger = logging.getLogger('common.itemFactory');
logger.setLevel(0);

exports = Singleton(function(supr) {
	
	this.init = function(data) {
		this._items = {};
	}
	
	this.loadItemSnapshot = function(snapshot) {
		logger.log('Loading snapshot for item', snapshot);
		var item = this.getItem(snapshot.id);
		item.setType(snapshot.type);
		for (var key in snapshot.properties) {
			item.updateProperty(key, snapshot.properties[key]);
		}
	}
	
	this.getItem = function(id) {
		if (!this._items[id]) { this._items[id] = new common.Item(id); }
		return this._items[id];
	}
	
})
