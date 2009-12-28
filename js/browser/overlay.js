jsio('from common.javascript import Singleton, bind');

jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.events as events');

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
	
	this.show = function(content, notDismissable) {
		document.body.appendChild(this.getElement());
		this._content.innerHTML = '';
		this._content.appendChild(content);
		browser.resizeManager.onWindowResize(this._resizeCallback);
	}
	
	this.hide = function() {
		dom.remove(this._element);
		browser.resizeManager.cancelWindowResize(this._resizeCallback);
		events.remove(this._underlay, 'click', this._clickHandler);
	}
	
	this.onWindowResize = function(size) {
		dom.setStyle(this._underlay, size);
		var contentSize = dimensions.getSize(this._content.firstChild);
		dom.setStyle(this._content, { left: (size.width / 2) - (contentSize.width / 2),
			top: (size.height / 2) - (contentSize.height / 2) });
	}
})