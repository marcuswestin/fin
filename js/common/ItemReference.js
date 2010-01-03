jsio('from common.javascript import Class, bind, forEach');
jsio('import common.Publisher')
jsio('import common.itemFactory')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(sourceItem, referencedItemType, itemReferencePropertyName) {
		supr(this, 'init');
		this._proxiedCalls = [];
		this._referencedItemType = referencedItemType;
		var referenceItemId = sourceItem.getProperty(itemReferencePropertyName);
		if (referenceItemId) {
			this._referencedItem = common.itemFactory.getItem(referenceItemId);
		}
		sourceItem.subscribeToProperty(itemReferencePropertyName, 
			bind(this, '_onReferenceChanged'));
	}
	
	this.getReferencedItem = function() { return this._referencedItem; }
	
	this._onReferenceChanged = function(newReferenceItemId) {
		this._referencedItem = common.itemFactory.getItem(newReferenceItemId);
		forEach(this._proxiedCalls, bind(this, function(proxiedCall){
			var methodName = proxiedCall[0];
			var args = proxiedCall[1];
			this[methodName].apply(this, args);
		}))
		this._publish('ReferenceChanged')
	}
	
	this.getId = function() { return this._referencedItem.getId(); }
	this.asObject = function() { return this._referencedItem.asObject(); }
	this.toString = function() { return this._referencedItem.toString(); }
	this.getType = function() { return this._referencedItemType; }
	this.getProperty = function(propertyName) { 
		if (this._referencedItem) { 
			return this._referencedItem.getProperty(propertyName); 
		} else {
			return 'loading...';
		}
	}
	
	var self = this;
	function createProxiedMethod(context, methodName) {
		return function() {
			if (!this._referencedItem) { 
				this._proxiedCalls.push([methodName, arguments]);
				return;
			}
			this._referencedItem[methodName].apply(this._referencedItem, arguments);
		}
	}
	
	this.subscribe = createProxiedMethod(this, 'subscribe');
	this.unsubscribe = createProxiedMethod('unsubscribe');
	this.mutate = createProxiedMethod('mutate');
	this.applyMutation = createProxiedMethod('applyMutation');
	this.setSnapshot = createProxiedMethod('setSnapshot');
	this.setType = createProxiedMethod('setType');
	this.subscribeToProperty = createProxiedMethod('subscribeToProperty');
})