jsio('from common.javascript import Class');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(label) {
		supr(this, 'init');
		this._label = label;
	}
	
	this.createContent = function() {
		this.addClassName('Panel');
		this._loading = dom.create({ parent: this._element, className: 'spinner', 
			text: 'Loading...', style: {display: 'none'} });
		
		var layoutTable = dom.create({ type: 'table', parent: this._element });
		this._layout = dom.create({ type: 'tr', parent: layoutTable });
		
		this._labelEl = dom.create({ type: 'td', parent: this._layout,
			className: 'panelLabel', html: (this._label + 's').split('').join('<br />') });
	}
	
	this.resize = function(width, height) {
		dom.setStyle(this._element, { width: width, height: height });
		dom.setStyle(this._labelEl, { height: height - 4 });
	}
	
	this.hide = function() { this._element.style.display = 'none'; }
	this.show = function() { this._element.style.display = 'block'; }
	
	this.showSpinner = function() { this._loading.style.display = 'block'; }
	this.hideSpinner = function() { this._loading.style.display = 'none'; }
	
	this.getLabel = function() { return this._label; }
})
