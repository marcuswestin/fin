jsio('from common.javascript import Class, bind, forEach');
jsio('import common.Publisher')
jsio('import common.itemFactory')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(sourceItem, referencedItemType, itemReferencePropertyName) {
		supr(this, 'init');
		this._proxiedCalls = [];
		this._referencedItemType = referencedItemType;
		var referenceItemId = sourceItem.getProperty(itemReferencePropertyName, true);
		if (referenceItemId) {
			this._referencedItem = common.itemFactory.getItem(referenceItemId);
		}
		sourceItem.subscribeToProperty(itemReferencePropertyName, 
			bind(this, '_onReferenceChanged'));
	}
	
	this.getReferencedItem = function() { return this._referencedItem; }
	
	this._onReferenceChanged = function(newReferenceItemId) {
		this._referencedItem = common.itemFactory.getItem(newReferenceItemId);
		for (var i=0, proxiedCall; proxiedCall = this._proxiedCalls[i]; i++) {
			var methodName = proxiedCall[0];
			var args = proxiedCall[1];
			this[methodName].apply(this, args);
		}
		this._proxiedCalls = [];
		this._publish('ReferenceChanged')
	}
	
	this.getId = function() { return this._referencedItem.getId(); }
	this.asObject = function() { return this._referencedItem.asObject(); }
	this.toString = function() { return this._referencedItem.toString(); }
	this.getType = function() { return this._referencedItemType; }
	this.getProperty = function(propertyName, noDefault) { 
		if (this._referencedItem) { 
			return this._referencedItem.getProperty(propertyName); 
		} else if (noDefaultValue) {
			return null
		} else {
			return propertyName;
		}
	}
	
	function createProxiedMethod(methodName) {
		return function() {
			if (!this._referencedItem) { 
				this._proxiedCalls.push([methodName, arguments]);
				return;
			}
			this._referencedItem[methodName].apply(this._referencedItem, arguments);
		}
	}
	
	this.subscribe = createProxiedMethod('subscribe');
	this.unsubscribe = createProxiedMethod('unsubscribe');
	this.mutate = createProxiedMethod('mutate');
	this.applyMutation = createProxiedMethod('applyMutation');
	this.setSnapshot = createProxiedMethod('setSnapshot');
	this.setType = createProxiedMethod('setType');
	this.subscribeToProperty = createProxiedMethod('subscribeToProperty');
})