jsio('from common.javascript import Class');

jsio('import browser.events as events');

jsio('import browser.UIComponent');
jsio('import browser.keystrokeManager');

exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(defaultText, isPassword) {
		supr(this, 'init');
		this._defaultText = defaultText;
		this._isPassword = isPassword;
	}
	
	this.createContent = function() {
		this._element = document.createElement('input'); // overwrite UIComponent's element
		this._element.type = this._isPassword ? 'password' : 'text';
		this.addClassName('Input');
		this._element.value = this._defaultText;
		events.add(this._element, 'focus', bind(this, '_onFocus'));
		events.add(this._element, 'blur', bind(this, '_onBlur'));
		this._onBlur();
	}
	
	this.getValue = function() { return this._element.value; }
	this.focus = function() { this.getElement().focus(); }
	
	this._onFocus = function() {
		this._keystrokeHandler = browser.keystrokeManager.requestFocus(bind(this, '_onKeystroke'));
		if (this._element.value != this._defaultText) { return; }
		if (this._isPassword) { this._element.type = 'password'; }
		this.removeClassName('defaultValue');
		this._element.value = '';
	}
	
	this._onBlur = function() {
		browser.keystrokeManager.release(this._keystrokeHandler);
		if (this._element.value != '') { return; }
		if (this._isPassword) { this._element.type = 'text'; }
		this.addClassName('defaultValue');
		this._element.value = this._defaultText;
	}
	
	this._onKeystroke = function(e) {
		this._publish('Keystroke', e);
	}
})