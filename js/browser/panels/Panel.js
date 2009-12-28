jsio('from common.javascript import Class, bind');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');
jsio('import browser.events as events');

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
		
		this._labelEl = dom.create({ parent: this._element, className: 'panelLabel' });
		var closeButton = dom.create({ parent: this._labelEl, className: 'closeButton', html: '[x]'});
		var label = dom.create({ parent: this._labelEl, className: 'labelText', 
				html: (this._label).split('').join('<br />') });
		
		events.add(this._labelEl, 'click', bind(this._manager, 'focusPanel', this));
		events.add(closeButton, 'click', bind(this._manager, 'removePanel', this));
	}

	this.resize = function(size) {
		dom.setStyle(this._element, size);
	}
	
	this.getDimensions = function() { return dimensions.getDimensions(this._element); }
	
	this.getLabel = function() { return this._label; }
	this.toString = function() { return this._item.toString(); }
})
