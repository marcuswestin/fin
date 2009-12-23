jsio('from common.javascript import Class');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(manager, item) {
		supr(this, 'init');
		this._manager = manager;
		this._item = item;
		this._label = typeof item == 'string' ? item : item.getType();
	}
	
	this.createContent = function() {
		this.addClassName('Panel');
		this._loading = dom.create({ parent: this._element, className: 'spinner', 
			text: 'Loading...', style: {display: 'none'} });
		this._labelEl = dom.create({ type: 'td', parent: this._element,
			className: 'panelLabel', html: (this._label).split('').join('<br />') });
	}
	
	this.getLabel = function() { return this._label; }
})
