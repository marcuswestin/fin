jsio('from common.javascript import Class, bind');

exports = Class(function() {
	this.init = function(couchdb, database) {
		var host = '127.0.0.1', port = 5984;
	  	this._db = couchdb.createClient(port, host).db(database)
	}
	
	this.ensureExists = function() {
		this._db.exists().addCallback(bind(this, function(exists){
			if (!exists) { this._db.create() }
		}))
	}
	
	this.createItem = function(type, callback) {
		this._db.saveDoc({ type: type, properties: {} })
			.addCallback(callback)
	}
	
	// this.createUser = function(username, hashedPassword, callback) {
	// 	var userProperties = { password: hashedPassword, email: username }
	// 	this._db.saveDoc({ _id: username, type: 'user', properties: userProperties })
	// 		.addCallback(callback)
	// }
	
	this.getItemData = function(itemId, callback) {
		if (!itemId) { 
			logger.warn("getItemData called without an itemId. Refusing to pull all documents."); 
			return callback(null);
		}
		this._db.getDoc(itemId).addCallback(callback)
	}
	
	this.storeItemData = function(itemData, callback) {
		logger.log('store item data', JSON.stringify(itemData))
		this._db.saveDoc(itemData).addCallback(callback);
	}
	
	// this.getList = function(label, callback) {
	// 	logger.log('get list for', label)
	// 	this._db.view(label + '/label'), { success: callback, error: bind(this, callback, false) });
	// }
	
	// this.getItemTypes = function(callback) {
	// 	logger.log('Get item types')
	// 	this._db.view('util/types', { success: callback, error: bind(this, callback, false) });
	// }
})