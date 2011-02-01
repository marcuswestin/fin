var Class = require('../shared/util').Class

module.exports = Class(function(){
	
	this.init = function() {
		this._pool = {}
		this._counts = {}
		this._uniqueId = 0
	}
	
	this.add = function(name, item) {
		if (!this._pool[name]) { 
			this._pool[name] = {}
			this._counts[name] = 0
		}
		this._counts[name]++
		var id = 'p' + this._uniqueId++
		this._pool[name][id] = item
		return id
	}
	
	this.remove = function(name, id) {
		var item = this._pool[name][id]
		delete this._pool[name][id]
		if (this._counts[name]-- == 0) {
			delete this._counts[name]
			delete this._pool[name]
		}
		return item
	}
	
	this.get = function(name) {
		return this._pool[name]
	}
	
	this.count = function(name) {
		return this._counts[name] || 0
	}
	
})
