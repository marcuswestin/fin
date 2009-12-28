jsio('from common.javascript import Singleton')

jsio('import browser.events as events');

exports = Singleton(function(){
	
	this.init = function() {
		events.add(window, 'keypress', bind(this, '_onKeyPress'));
	}
	
	this.requestFocus = function(handler) {
		this._keystrokeHandler = handler;
		return this._keystrokeHandler;
	}
	
	this.release = function(handler) {
		if (handler != this._keystrokeHandler) { return; }
		this._keystrokeHandler = null;
	}
	
	this._onKeyPress = function(e) {
		if (!this._keystrokeHandler) { return; }
		this._keystrokeHandler(e);
	}
})

