jsio('from common.javascript import Class, bind');
jsio('import browser.dimensions');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.itemFocus');
jsio('import browser.ItemView');
jsio('import browser.ListComponent');

jsio('import browser.panels.Panel');

css.loadStyles(jsio.__path);

exports = Class(browser.panels.Panel, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);
		this._label = this._item;
		this._listComponent = new browser.ListComponent(bind(this, '_onItemSelected'), 
			bind(this, '_onItemFocused'));
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ListPanel');
		events.add(this._content, 'scroll', bind(this, '_onScroll'));
	}
	
	this.addItem = function(item) {
		item.addClassName('listItem');
		this._content.appendChild(item.getElement());
		this._listComponent.addItem(item);
		if (this.hasFocus()) { this._listComponent.focus(); }
		this._manager.layout();
	}
	
	this.focus = function() {
		supr(this, 'focus');
		if (this.isMinimized()) { return; }
		this._listComponent.focus();
	}
	
	this._onItemSelected = function(item) {
		this._publish('ItemSelected', item);
	}
	
	this._onScroll = function() {
		browser.itemFocus.layout();
	}
	
	this._onItemFocused = function(item) {
		var itemDimensions = browser.dimensions.getDimensions(item.getElement());
		if (itemDimensions.top + itemDimensions.height > this._layout.height) {
			this._content.scrollTop += itemDimensions.height;
			return true; // to prevent updating position of focus until scroll event fires
		} else if (itemDimensions.top < this._content.scrollTop) {
			this._content.scrollTop -= itemDimensions.height;
			return true; // to prevent updating position of focus until scroll event fires
		}
	}
})