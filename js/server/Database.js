jsio('from common.javascript import Class, bind');

var logger = logging.getLogger('server.Database');
logger.setLevel(0);


exports = Class(function() {
	this.init = function(CouchDB) {
		var host = '127.0.0.1', port = 5984;
		this._db = new CouchDB.db('items', port, host);
	}
	
	this.createItem = function(type, callback) {
		this._db.saveDoc({ type: type, properties: {} }, { success: callback, error: bind(this, callback, false) });
	}
	
	this.getItemData = function(itemId, callback) {
		this._db.openDoc(itemId, { success: callback, error: bind(this, callback, false) });
	}
	
	this.storeItemData = function(itemData, callback) {
		logger.log('store item data', JSON.stringify(itemData))
		this._db.saveDoc(itemData, { success: callback, error: bind(this, callback, false) });
	}
	
	this.getList = function(label, callback) {
		logger.log('get list for', label)
		this._db.view(label + '/label', { success: callback, error: bind(this, callback, false) });
	}
	
	this.getItemTypes = function(callback) {
		logger.log('Get item types')
		this._db.view('util/types', { success: callback, error: bind(this, callback, false) });
	}
})