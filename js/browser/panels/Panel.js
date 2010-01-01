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
		this._label = typeof item == 'string' ? item : item.getType ? item.getType() : item.toString();
	}
	
	this.createContent = function() {
		this.addClassName('Panel');
		this._content = dom.create({ parent: this._element, className: 'content' });
		this._loading = dom.create({ parent: this._content, className: 'spinner', 
				text: 'Loading...', style: {display: 'none'} });
		
		this._labelEl = dom.create({ parent: this._element, className: 'panelLabel' });
		var closeButton = dom.create({ parent: this._labelEl, className: 'closeButton' });
		this._labelText = dom.create({ parent: this._labelEl, className: 'labelText', text: this._label });
		setTimeout(bind(this, 'sizeLabel'));
		
		events.add(this._labelEl, 'click', bind(this._manager, 'focusPanel', this));
		events.add(closeButton, 'click', bind(this._manager, 'removePanel', this));
	}
	
	this.sizeLabel = function() {
		var textSize = dimensions.getSize(this._labelText);
		dom.setStyle(this._labelEl, { width: 8, height: textSize.width + 18 }) // rotated by 90 deg
		dom.setStyle(this._labelText, { right: (-textSize.width / 2) + 10, top: textSize.width / 2 })
	}

	this.layout = function(layout) {
		this._layout = layout;
		dom.setStyle(this._element, { left: layout.left, top: layout.top, 
			width: layout.width, height: layout.height });
		dom.setStyle(this._content, { width: layout.width - 8, height: layout.height - 8 });
	}
	
	this.getDimensions = function() { return dimensions.getDimensions(this._element); }
	
	this.getLabel = function() { return this._label; }
	this.toString = function() { return this._item.toString(); }
	
	this.focus = function() { this.addClassName('focused'); }
	this.blur = function() { this.removeClassName('focused'); }
	
	this.show = function() {
		supr(this, 'show');
		this.sizeLabel();
	}
})
