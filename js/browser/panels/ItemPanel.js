jsio('from common.javascript import Class, bind, forEach');
jsio('import common.ItemReference');
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

		this._listComponent = new browser.ListComponent(bind(this, '_onItemSelected'));
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ItemPanel');
		this._itemView = new browser.ItemView(this._item, this._item.getType(), 'panel');
		this._itemView.appendTo(this._content);
		forEach(this._itemView.getViews(), bind(this, function(view) {
			this._listComponent.addItem(view);
		}))
	}
	
	this.focus = function() {
		supr(this, 'focus');
		this._listComponent.focus();
	}
	
	this._onItemSelected = function(item) {
		if (item instanceof common.ItemReference) {
			gPanelManager.showItem(item);
		} else {
			var valueView = this._listComponent.getFocusedItem();
			this._itemView.makeEditable(valueView);
		}
	}
})