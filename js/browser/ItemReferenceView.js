jsio('from common.javascript import Class, bind')
jsio('import browser.UIComponent')
// jsio('import browser.ItemView') see note below on jsio circular imports...
jsio('import browser.events as events')

exports = Class(browser.UIComponent, function(supr){
	
	this.init = function(itemReference, itemType) {
		supr(this, 'init');
		this._itemReference = itemReference;
		this._itemType = itemType;
	}
	
	this.createContent = function() {
		this._itemReference.subscribe('ReferenceChanged', bind(this, '_renderView'));
		this._renderView();
	}
	
	this._renderView = function() {
		this._element.innerHTML = '';
		// jsio doesn't support circular imports...
		var itemView = new window.__gItemViewClass(this._itemReference, this._itemType, 'reference');
		itemView.appendTo(this._element);
		events.add(itemView.getElement(), 'click', bind(this, '_publish', 'Click'));
	}
})

