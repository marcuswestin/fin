jsio('from shared.javascript import Class')

exports = Class(function(){
	
	this.init = function() {
		this._pool = {}
		this._counts = {}
		this._uniqueId = 0
	}
	
	this.add = function(name, callback) {
		if (!this._pool[name]) { 
			this._pool[name] = {}
			this._counts[name] = 0
		}
		this._counts[name]++
		var id = 'p' + this._uniqueId++
		this._pool[name][id] = callback
		return id
	}
	
	this.remove = function(name, id) {
		delete this._pool[name][id]
		if (this._counts[name]-- == 0) { delete this._counts[name] }
	}
	
	this.get = function(name) {
		return this._pool[name]
	}
	
	this.count = function(name) {
		return this._counts[name] || 0
	}
	
})