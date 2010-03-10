jsio('from common.javascript import Class');

exports = Class(function(){
	
	this.init = function() {
		this._pool = {}
		this._uniqueId = 0
	}
	
	this.add = function(signal, callback) {
		if (!this._pool[signal]) { this._pool[signal] = {} }
		var id = 'p' + this._uniqueId++;
		this._pool[signal][id] = callback
		return id
	}
	
	this.remove = function(signal, id) {
		delete this._pool[signal][id]
	}
	
	this.get = function(signal) {
		return this._pool[signal]
	}
	
})