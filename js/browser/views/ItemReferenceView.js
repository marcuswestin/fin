jsio('from common.javascript import Class, bind')
jsio('import browser.UIComponent')
// jsio('import browser.ItemView') see note below on jsio circular imports...
jsio('import browser.events as events')
jsio('import common.ItemReference')

exports = Class(browser.UIComponent, function(supr){
	
	this.initializeView = function(sourceItem, args) {
		var referencedItemType = args[0];
		var itemReferencePropertyName = args[1];
		this._itemReference = new common.ItemReference(sourceItem, referencedItemType, itemReferencePropertyName);
	}
	
	this.createContent = function() {
		this._itemReference.subscribe('ReferenceChanged', bind(this, '_renderView'));
		this._renderView();
	}
	
	this._renderView = function() {
		this._element.innerHTML = '';
		// jsio doesn't support circular imports...
		var itemView = new window.__gItemViewClass(this._itemReference, this._itemReference.getType(), 'reference');
		itemView.appendTo(this._element);
		events.add(itemView.getElement(), 'click', bind(this, '_onItemViewClick'));
	}
	
	this._onItemViewClick = function(e) {
		events.cancel(e);
		this._publish('Click');
	}
	
	this.getReferencedItem = function() {
		return this._itemReference.getReferencedItem();
	}
	
	this.handleSelected = function(listComponent) {
		if (!this._itemReference.getReferencedItem()) { return; }
		gPanelManager.showItem(this.getReferencedItem());
	}
})

