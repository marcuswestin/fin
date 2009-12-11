module('from common.javascript import Class');

exports = Class(function() {
	
	this.init = function() {
		this._subscribers = {};
	}
	
	this.subscribe = function(signal, callback) {
		if (!this._subscribers[signal]) { this._subscribers[signal] = []; }
		this._subscribers[signal].push(callback);
	}

	this.publish = function(signal) {
		var args = Array.prototype.slice.call(arguments, 1);
		var subscribers = this._subscribers[signal] || [];
		for (var i=0, callback; callback = subscribers[i]; i++) {
			callback.apply(this, args);
		}
	}
	
})