module('from common.javascript import Singleton, bind');
module('import browser.dimensions')
module('import browser.dom')
module('import browser.events')

exports = Singleton(function(){
	
	var PADDING = 2;

	this.init = function() {
		this._input = document.createElement('textarea');
		this._input.style.position = 'absolute';
		browser.events.add(this._input, 'keypress', bind(this, 'onKeyPress'))
		browser.events.add(this._input, 'blur', bind(this, 'hide'))
	}
	
	this.setValue = function(value) {
		this._input.value = value;
	}
	
	this.showAt = function(dom, onValueChangeCallback) {
		var position = browser.dimensions.getPosition(dom);
		var size = browser.dimensions.getSize(dom);
		
		this._input.style.top = position.top - PADDING + 'px';
		this._input.style.left = position.left - PADDING + 'px';
		this._input.style.width = size.width + PADDING * 2 + 'px';
		this._input.style.height = size.height + PADDING * 2 + 'px';
		
		this._onValueChangeCallback = onValueChangeCallback;
		
		document.body.appendChild(this._input);
		this._input.focus();
		this._input.select();
	}
	
	this.hide = function() {
		document.body.removeChild(this._input);
	}
	
	this.onKeyPress = function(e) {
		if (e.keyCode == browser.events.KEY_ENTER) {
			this._input.blur();
			browser.events.cancel(e);
		}
		setTimeout(bind(this, function() {
			this._onValueChangeCallback(this._input.value);
		}), 0)
	}
})