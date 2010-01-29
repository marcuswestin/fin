jsio('from common.javascript import Singleton, bind');
jsio('import common.sha1');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.overlay');
jsio('import browser.resizeManager');
jsio('import browser.keystrokeManager')

jsio('import browser.UIComponent');
jsio('import browser.Input');

var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Singleton(browser.UIComponent, function(supr) {
	
	this.requestAuthentication = function(submitCallback, message) {
		this._onSubmit = submitCallback;
		if (message) {
			this._message.innerHTML = '<div class="innerMessage">' + message + '</div>';
			this._message.style.display = 'inline';
		} else {
			this._message.style.display = 'none';
		}
		this._emailInput.focus();
	}
	
	this.createContent = function() {
		this.addClassName('LoginManager');
		this._message = dom.create({ parent: this._element, className: 'message' });
		
		this._emailInput = new browser.Input('email');
		this._emailInput.appendTo(this._element);
		this._emailInput.addClassName('email');

		this._passwordInput = new browser.Input('password', true);
		this._passwordInput.appendTo(this._element);
		this._passwordInput.addClassName('password');
		
		browser.keystrokeManager.handleKeys({ 'enter': bind(this, '_submit')}, true);
		setTimeout(bind(this._emailInput, 'focus'));
		
		this._emailInput.getElement().value = 'marcus@meebo-inc.com';
		this._passwordInput.getElement().value = '123123';
	}
	
	this._submit = function() {
		this._onSubmit(this._emailInput.getValue(), common.sha1(this._passwordInput.getValue()));
	}
})
