jsio('from common.javascript import Class, bind');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.ItemView');
jsio('import browser.ListComponent');

jsio('import .Panel');

css.loadStyles(jsio.__path);

exports = Class(Panel, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);
		this._label = this._item;
		this._listComponent = new browser.ListComponent(bind(this, '_onItemSelected'));
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ListPanel');
	}
	
	this.addItem = function(item) {
		item.addClassName('listItem');
		this._content.appendChild(item.getElement());
		this._listComponent.addItem(item);
		this._manager.resize();
	}
	
	this.focus = function() {
		supr(this, 'focus');
		this._listComponent.focus();
	}
	
	this._onItemSelected = function(item) {
		this._publish('ItemSelected', item);
	}
})