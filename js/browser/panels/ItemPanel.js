jsio('from common.javascript import Class, bind, forEach');
jsio('import common.ItemReference');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.editable')
jsio('import browser.ItemView');
jsio('import browser.ItemReferenceView');
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
		forEach(this._itemView.getPropertyViews(), bind(this, function(propertyView) {
			this._listComponent.addItem(propertyView);
			if (propertyView instanceof browser.ItemReferenceView) {
				propertyView.subscribe('Click', bind(this, function() {
					gPanelManager.showItem(propertyView.getReferencedItem());
				}));
			} else {
				propertyView.subscribe('DoubleClick', bind(this, '_makeEditable', propertyView));
			}
		}));
		if (this.hasFocus()) { this._listComponent.focus(); }
	}
	
	this._makeEditable = function(view) {
		browser.editable.setValue(this._item.getProperty(view.getPropertyName()) || '');
		browser.editable.showAt(view.getElement(), bind(this, '_onMutation', view), bind(this, '_onEditableHide'));
	}
	
	this._onMutation = function(view, mutation, value) {
		view.setValue(value); // set the value of the element beneath the input early, so that its size updates correctly
		mutation.property = view.getPropertyName();
		this._item.mutate(mutation);
	}
	
	this._onEditableHide = function() {
		if (!this.hasFocus()) { return; }
		this._listComponent.focus();
	}
	
	this.focus = function() {
		supr(this, 'focus');
		this._listComponent.focus();
	}
	
	this._onItemSelected = function(item) {
		if (item instanceof common.ItemReference || item instanceof browser.ItemReferenceView) {
			gPanelManager.showItem(item.getReferencedItem());
		} else {
			var valueView = this._listComponent.getFocusedItem();
			this._makeEditable(valueView);
		}
	}
})