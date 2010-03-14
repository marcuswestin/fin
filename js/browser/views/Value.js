jsio('from common.javascript import Class, bind')

exports = Class(function(supr){
	
	this._domType = 'span'
	
	this.init = function(jsArgs, viewArgs) {
		var itemIds = jsArgs[0],
			property = viewArgs[0]
		
		this._element = document.createElement(this._domType)

		this._propertyChain = property.split('.')
		var itemId = (typeof itemIds == 'string' 
				? itemIds 
				: itemIds[this._propertyChain.shift()])
		this._item = fin.getItem(itemId)
		this._item.addDependant(this._propertyChain, bind(this, '_onMutation'))
	}
	
	this._onItemMutation = function(mutation) {
		this.setValue(mutation.value)
	}
	
	this.getElement = function() { return this._element }
	
	this.setValue = function(value) {
		if (typeof value == 'undefined') { return }
		value = value.replace(/\n/g, '<br />')
		value = value.replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
	}
})