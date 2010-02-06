jsio('from common.javascript import Class, bind, forEach');
jsio('import common.ItemReference');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.ItemView');
jsio('import browser.views.ItemReferenceView');
jsio('import browser.ListComponent');
jsio('import browser.panels.Panel');

css.loadStyles(jsio.__path);

exports = Class(browser.panels.Panel, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);

		this._listComponent = new browser.ListComponent();
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ItemPanel');
		this._itemView = new browser.ItemView(this._item, this._item.getType(), 'panel');
		this._itemView.appendTo(this._content);
		var views = this._itemView.getPropertyViews();
		forEach(views, bind(this._listComponent, 'addItem'));
		if (this.hasFocus()) { this._listComponent.focus(); }
	}
	
	this.focus = function() {
		supr(this, 'focus');
		if (this.isMinimized()) { return; }
		this._listComponent.focus();
	}
})