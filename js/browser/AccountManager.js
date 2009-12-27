jsio('from common.javascript import Class, bind');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.overlay');
jsio('import browser.resizeManager');

jsio('import browser.UIComponent');

var logger = logging.getLogger('browser.AccountManager');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.requestAuthentication = function(submitCallback, message) {
		this._onSubmit = submitCallback;
		if (message) {
			this._message.innerHTML = '<div class="innerMessage">' + message + '</div>';
			this._message.style.display = 'inline';
		} else {
			this._message.style.display = 'none';
		}
	}
	
	this.createContent = function() {
		this.addClassName('AccountManager');
		this._message = dom.create({ parent: this._element, className: 'message' });
		this._emailInput = dom.create({ parent: this._element, type: 'input', className: 'email' });
		this._passwordInput = dom.create({ parent: this._element, type: 'input', className: 'password' });
		this._passwordInput.type = 'password';
		events.add(this._emailInput, 'keypress', bind(this, 'onKeyPress'));
		events.add(this._passwordInput, 'keypress', bind(this, 'onKeyPress'));
		events.add(this._emailInput, 'focus', bind(this, 'onInputFocus', this._emailInput, 'email'));
		events.add(this._passwordInput, 'focus', bind(this, 'onInputFocus', this._passwordInput, 'password'));
		events.add(this._emailInput, 'blur', bind(this, 'onInputBlur', this._emailInput, 'email'));
		events.add(this._passwordInput, 'blur', bind(this, 'onInputBlur', this._passwordInput, 'password'));
		this._emailInput.value = 'marcus@meebo-inc.com';
		this._passwordInput.value = '123123';
		this.onInputBlur(this._emailInput, 'email');
		this.onInputBlur(this._passwordInput, 'password');

		this._passwordInput.focus();
	}
	
	this.onInputFocus = function(input, defaultValue) {
		if (input.value == defaultValue) {
			input.value = '';
			if (defaultValue == 'password') { input.type = 'password'; }
			css.removeClassName(input, 'defaultValue');
		}
	}
	
	this.onInputBlur = function(input, defaultValue) {
		if (input.value == '') {
			input.value = defaultValue;
			if (defaultValue == 'password') { input.type = 'text'; }
			css.addClassName(input, 'defaultValue');
		}
	}
	
	this.onKeyPress = function(e) {
		if (e.keyCode == events.KEY_ENTER) {
			events.cancel(e);
			this._onSubmit(this._emailInput.value, this._hashPassword(this._passwordInput.value));
		}
	}
	
	this._hashPassword = function(password) {
		return 'FAKE_HASHED_' + password;
	}
})
