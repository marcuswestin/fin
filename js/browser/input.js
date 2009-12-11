module('from common.javascript import Singleton, bind');
module('import browser.dimensions')
module('import browser.dom')
module('import browser.events')

exports = Singleton(function(){
	
	var PADDING = 4;

	this.init = function() {
		this._input = document.createElement('input');
		this._input.style.position = 'absolute';
		this._input.style.padding = '1px 0 0 3px'
		browser.events.add(this._input, 'keypress', bind(this, 'onKeyPress'))
		browser.events.add(this._input, 'blur', bind(this, 'hide'))
	}
	
	this.setValue = function(value) {
		this._input.value = value;
	}
	
	this.showAt = function(dom, onValueChangeCallback) {
		this._targetDom = dom;
		this._onValueChangeCallback = onValueChangeCallback;

		this._input.style.fontSize = browser.dom.getStyle(dom, 'font-size');
		this._input.style.fontFamily = browser.dom.getStyle(dom, 'font-family');
		
		this._resize();
		
		if (!this._input.parentNode) { 
			document.body.appendChild(this._input); 
			this._input.focus();
		}
	}
	
	this._resize = function() {
		var position = browser.dimensions.getPosition(this._targetDom);
		var size = browser.dimensions.getSize(this._targetDom);
		
		var inputOffset = 0; // to make the text inside the input line up with text it overlays
		this._input.style.top = position.top - PADDING - inputOffset + 'px';
		this._input.style.left = position.left - PADDING + 'px';
		this._input.style.width = size.width + PADDING * 2 + 30 + 'px';
		this._input.style.height = size.height + PADDING * 2 + 'px';
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
			this._resize();
			this._onValueChangeCallback(this._input.value);
		}), 0)
	}
})