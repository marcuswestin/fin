jsio('from shared.javascript import Class, bind')

exports = Class(function(supr){
	
	this._domTag = 'span'
	this._className = 'Value'
	this._keys = { 'enter': 13, 'backspace': 8 }
	
	this.init = function(jsArgs, viewArgs) {
		var itemIds = jsArgs[0],
			property = viewArgs[0]
		
		this._element = document.createElement(this._domTag)
		if (this._domType) { this._element.type = this._domType }
		this._element.className = this._className
		
		this._propertyChain = property.split('.')
		var itemId = (typeof itemIds == 'string' 
				? itemIds 
				: itemIds[this._propertyChain.shift()])
		this._item = fin.getItem(itemId)
		this._item.addDependant(this._propertyChain, bind(this, '_onItemMutation'))
	}
	
	this._onItemMutation = function(mutation, newValue) {
		this.setValue(newValue)
	}
	
	this.getElement = function() { return this._element }
	
	this.setValue = function(value) {
		if (typeof value == 'undefined') { return }
		value = value.replace(/\n/g, '<br />')
		value = value.replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
		this._element.className = this._className + ' fin-Value-' + this._property + '-' + value
	}
	
	this._getItem = function() {
		return this._item.getChainedItem(this._propertyChain)
	}
})