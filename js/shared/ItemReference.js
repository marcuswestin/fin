// jsio('from shared.javascript import Class, bind, forEach')
// jsio('import shared.Publisher')
// 
// exports = Class(shared.Publisher, function(supr) {
// 	
// 	this.init = function(factory, sourceItem, itemReferencePropertyName) {
// 		supr(this, 'init')
// 		this._factory = factory
// 		this._proxiedCalls = []
// 		this._dependants = []
// 		var referenceItemId = sourceItem.getProperty(itemReferencePropertyName, true)
// 		sourceItem.addDependant(itemReferencePropertyName, bind(this, '_onReferenceChanged'))
// 	}
// 	
// 	this.getReferencedItem = function() { return this._referencedItem }
// 	
// 	this._onReferenceChanged = function(mutation, referencedItemId) {
// 		if (typeof referencedItemId == 'undefined') { return }
// 		this._referencedItem = this._factory.getItem(referencedItemId)
// 		for (var i=0, proxiedCall; proxiedCall = this._proxiedCalls[i]; i++) {
// 			var methodName = proxiedCall[0]
// 			var args = proxiedCall[1]
// 			this[methodName].apply(this, args)
// 		}
// 		this._proxiedCalls = []
// 		for (var i=0, dependant; dependant = this._dependants[i]; i++) {
// 			this._referencedItem.addDependant(dependant.propertyChain, dependant.dependantCallback)
// 		}
// 	}
// 	
// 	this.addDependant = function(propertyChain, dependantCallback) {
// 		propertyChain = propertyChain.slice(0)
// 		
// 		this._dependants.push({ propertyChain: propertyChain, dependantCallback: dependantCallback })
// 		if (this._referencedItem) {
// 			this._referencedItem.addDependant(propertyChain, dependantCallback)
// 		}
// 	}
// 	
// 	this.getId = function() { return this._referencedItem.getId() }
// 	this.toString = function() { return this._referencedItem.toString() }
// 	this.getProperty = function(propertyName) { 
// 		if (this._referencedItem) { 
// 			return this._referencedItem.getProperty(propertyName) 
// 		} else {
// 			return undefined
// 		}
// 	}
// 	
// 	function createProxiedMethod(methodName) {
// 		return function() {
// 			if (!this._referencedItem) { 
// 				this._proxiedCalls.push([methodName, arguments])
// 				return
// 			}
// 			this._referencedItem[methodName].apply(this._referencedItem, arguments)
// 		}
// 	}
// 	
// 	this.subscribe = createProxiedMethod('subscribe')
// 	this.unsubscribe = createProxiedMethod('unsubscribe')
// 	this.mutate = createProxiedMethod('mutate')
// 	this.applyMutation = createProxiedMethod('applyMutation')
// 	this.setSnapshot = createProxiedMethod('setSnapshot')
// 	this.setRevision = createProxiedMethod('setRevision')
// })