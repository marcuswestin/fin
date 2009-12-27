jsio('from common.javascript import Singleton, bind');

jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');
jsio('import browser.css as css');

jsio('import browser.resizeManager');

jsio('import browser.UIComponent');

css.loadStyles(jsio.__path);

exports = Singleton(browser.UIComponent, function(supr) {
	
	this.init = function() {
		supr(this, 'init');
		this._resizeCallback = bind(this, 'onWindowResize');
	}
	
	this.createContent = function() {
		this.addClassName('Overlay');
		this._underlay = dom.create({ parent: this._element, className: 'underlay' });
		this._content = dom.create({ parent: this._element, className: 'content' });
	}
	
	this.show = function(content) {
		this.getElement();
		this._content.innerHTML = '';
		this._content.appendChild(content);
		document.body.appendChild(this.getElement());
		browser.resizeManager.onWindowResize(this._resizeCallback);
		this._resizeCallback(browser.resizeManager.getWindowSize());
	}
	
	this.hide = function() {
		dom.remove(this._element);
		browser.resizeManager.cancelWindowResize(this._resizeCallback);
	}
	
	this.onWindowResize = function(size) {
		dom.setStyle(this._underlay, size);
		dom.setStyle(this._content, size);
	}
})