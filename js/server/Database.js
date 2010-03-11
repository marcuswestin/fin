jsio('from common.javascript import Class, bind')

exports = Class(function() {
	this.init = function(db) {
		this._db = db
	}
	
	this.ensureExists = function() {
		this._db.exists(bind(this, function(exists){
			if (!exists) { this._db.create() }
		}))
	}
	
	this.getItemData = function(itemId, callback) {
		this._db.getDoc(itemId, bind(this, function(err, doc){
			if (err) {
				this._onGetItemError(itemId, callback)
				return
			}
			callback(err, doc)
		}))
	}
	
	this._onGetItemError = function(itemId, callback) {
		this._db.saveDoc(itemId, {}, bind(this, function(err, ok){
			if (err) throw err
			this._db.getDoc(itemId, callback)
		}))
	}
	
	this.storeItemData = function(itemData, callback) {
		logger.debug('store item data', JSON.stringify(itemData))
		this._db.saveDoc(itemData, callback)
	}
})