jsio('from shared.javascript import Class');

exports = Class(function() {
	
	this.init = function() {
		this._subscribers = {};
	}
	
	this.subscribe = function(signal, context, callback/*, curry1, curry2, ... */) {
		if (!this._subscribers[signal]) { this._subscribers[signal] = []; }
		var curry = Array.prototype.slice.call(arguments, 3)
		this._subscribers[signal].push({ ctx: context, cb: callback, curry: curry });
		return this
	}

	this.unsubscribe = function(signal, context, callback) {
		var subscribers = this._subscribers[signal] || []
		for (var i=0, sub; sub = subscribers[i]; i++) {
			if (sub.ctx != context || sub.cb != callback) { continue }
			subscribers.splice(i, 1)	
			break
		}
		return this
	}
	
	this._publish = function(signal) {
		var args = Array.prototype.slice.call(arguments, 1)
		var subscribers = this._subscribers[signal] || []
		for (var i=0, sub; sub = subscribers[i]; i++) {
			if (!sub.fn) { sub.fn = bind.apply(this, [sub.ctx, sub.cb].concat(sub.curry)) }
			sub.fn.apply(this, args)
		}
	}
})