jsio('from shared.javascript import Class');

exports = Class(function() {
	
	this.init = function() {
		this._subscribers = {};
	}
	
	this.subscribe = function(signal, callback) {
		if (!this._subscribers[signal]) { this._subscribers[signal] = []; }
		this._subscribers[signal].push(callback);
		return this
	}

	this.unsubscribe = function(signal, targetCallback) {
		var subscribers = this._subscribers[signal] || []
		for (var i=0, callback; callback = subscribers[i]; i++) {
			if (callback != targetCallback) { continue }
			subscribers.splice(i, 1)
			return
		}
		return this
	}
	
	this._publish = function(signal) {
		var args = Array.prototype.slice.call(arguments, 1)
		var subscribers = this._subscribers[signal] || []
		for (var i=0, callback; callback = subscribers[i]; i++) {
			callback.apply(this, args)
		}
	}
})