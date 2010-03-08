jsio('from common.javascript import Class, bind');

exports = Class(function() {
	this.init = function(db) {
		this._db = db
	}
	
	this.ensureExists = function() {
		this._db.exists(bind(this, function(exists){
			if (!exists) { this._db.create() }
		}))
	}
	
	// this.createUser = function(username, hashedPassword, callback) {
	// 	var userProperties = { password: hashedPassword, email: username }
	// 	this._db.saveDoc({ _id: username, type: 'user', properties: userProperties })
	// 		.addCallback(callback)
	// }
	
	this.getItemData = function(itemId, callback) {
		this._db.getDoc(itemId, bind(this, function(err, doc){
			if (err) {
				this._onGetItemError(itemId, callback);
				return;
			}
			callback(err, doc);
		}));
	}
	
	this._onGetItemError = function(itemId, callback) {
		this._db.saveDoc(itemId, {}, bind(this, function(err, ok){
			if (err) throw err
			this._db.getDoc(itemId, callback);
		}))
	}
	
	this.storeItemData = function(itemData, callback) {
		logger.log('store item data', JSON.stringify(itemData))
		this._db.saveDoc(itemData, callback)
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