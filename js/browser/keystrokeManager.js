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
	
	this.handleKeys = function(keyMap) {
		return this.requestFocus(bind(this, function(e) {
			var code;
			if (e.charCode != 0) {
				code = String.fromCharCode(e.charCode);
			} else if (e.keyCode != 0) {
				code = events.keyCodeMap[e.keyCode];
			}
			if (keyMap[code]) {
				keyMap[code]();
				events.cancel(e);
			}
		}));
	}

	this._onKeyPress = function(e) {
		if (!this._keystrokeHandler) { return; }
		this._keystrokeHandler(e);
	}
})
