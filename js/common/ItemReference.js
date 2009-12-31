jsio('from common.javascript import Class, bind');
jsio('import common.Publisher')
jsio('import common.itemFactory')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(sourceItem, itemReferenceIdPropertyName) {
		supr(this, 'init');
		this._sourceItem = sourceItem;
		var referenceItemId = sourceItem.getProperty(itemReferenceIdPropertyName);
		if (referenceItemId) {
			this._referenceItem = common.itemFactory.getItem(referenceItemId);
		}
		this._sourceItem.subscribeToProperty(itemReferenceIdPropertyName, 
			bind(this, '_onReferenceChanged'));
	}
	
	this.getReferencedItem = function() {
		return this._referenceItem; // This has to be reworked - the referenced item might be be here when this gets called.
		// instead of calling getReferencedItem, the ReferenceItem should proxy all important calls (getProperty, subscribe, subscribeToProperty) 
		// and return dummy answers if the referenced item has not been set yet. When the referenced item finally loads, queued subscribes
		// should be transfered over; 
	}
	
	this._onReferenceChanged = function(newReferenceItemId) {
		this._referenceItem = common.itemFactory.getItem(referenceItemId);
		this._publish('ReferenceChanged')
	}
	
})