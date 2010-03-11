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
	
	this.getAllItems = function(callback) {
		this._db.allDocs(bind(this, function(err, response) {
			if (err) { throw err }
			var outstandingItems = response.total_rows
			
			logger.info('Running through all items: ', outstandingItems)
			function onResponse(err, itemData) {
				if (err) { throw err }
				outstandingItems--
				logger.info('Running through item', itemData._id, "Outstanding:", outstandingItems)
				callback(itemData)
			}
			
			for (var i=0, row; row = response.rows[i]; i++) {
				this.getItemData(row.id, onResponse)
			}
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