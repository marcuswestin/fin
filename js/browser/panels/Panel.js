jsio('from common.javascript import Class, bind');
jsio('import browser.UIComponent');
jsio('import browser.keystrokeManager');
jsio('import browser.itemFocus');
jsio('import browser.css as css');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');
jsio('import browser.events as events');


css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this._contentMargin = 4;
	
	this.init = function(manager, item) {
		supr(this, 'init');
		this._manager = manager;
		this._item = item;
		this._label = typeof item == 'string' ? item : item.getType ? item.getType() : item.toString();
		this._layout = {};
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
		
		events.add(this._element, 'click', bind(this._manager, 'focusPanel', this));
		events.add(closeButton, 'click', bind(this, 'close'));
	}
	
	this.sizeLabel = function() {
		var textSize = dimensions.getSize(this._labelText);
		dom.setStyle(this._labelEl, { width: 8, height: textSize.width + 18 }) // rotated by 90 deg
		dom.setStyle(this._labelText, { right: (-textSize.width / 2) + 10, top: textSize.width / 2 })
	}

	this.layout = function(layout) {
		layout.top = typeof layout.top == 'undefined' ? this._layout.top : layout.top;
		layout.left = typeof layout.left == 'undefined' ? this._layout.left : layout.left;
		layout.width = typeof layout.width == 'undefined' ? this._layout.width : layout.width;
		layout.height = typeof layout.height == 'undefined' ? this._layout.height : layout.height;
		this._layout = layout;
		dom.setStyle(this._element, { left: layout.left, top: layout.top, 
			width: layout.width, height: layout.height });
		dom.setStyle(this._content, { width: layout.width - this._contentMargin * 2, 
			height: layout.height - this._contentMargin * 2, margin: this._contentMargin });
		if (this.hasFocus()) {
			browser.itemFocus.layout();
		}
	}
	
	this.close = function() {
		this._manager.removePanel(this);
	}

	this.getItem = function() { return this._item; }
	this.getLabel = function() { return this._label; }
	this.toString = function() { return this._item.toString(); }
	
	this.focus = function() { 
		this.addClassName('focused'); 
		gFocusedPanel = this;
		if (this.isMinimized()) {
			var labelEl = this._labelEl;
			var fakeView = { subscribe: function(){}, getElement: function(){ return labelEl; } }
			browser.itemFocus.showAt(fakeView);
			var onEnter = bind(this, function(){
				this.maximize();
				this.focus();
			})
			browser.keystrokeManager.handleKeys({ 'enter': onEnter });
		}
	}
	this.blur = function() { this.removeClassName('focused'); }
	this.hasFocus = function() { return this.hasClassName('focused'); }
	
	this.show = function() {
		supr(this, 'show');
		this.sizeLabel();
	}
	
	this.isMinimized = function() { return this.hasClassName('minimized'); }
	this.maximize = function() { 
		if (!this.isMinimized()) { return; }
		this.removeClassName('minimized'); 
		this.layout(this._maximizedLayout);
	}
	
	this.minimize = function() { 
		if (this.isMinimized()) { return; }
		this.addClassName('minimized');
		this._maximizedLayout = this._layout;
		this.layout({ width: 0 });
	}
})
