jsio('from common.javascript import Class, bind')

exports = Class(function(supr){
	
	this._domType = 'span'
	
	this.init = function(items, references) {
		this._element = document.createElement(this._domType)
		var reference = references[0] // only take one argument
		this._property = reference.property
		this._item = items[reference.item]
		
		this._item.addDependant(this._property, bind(this, '_onPropertyUpdated'))
	}
	
	this.getElement = function() { return this._element }
	
	this._setValue = function(value) {
		if (typeof value == 'undefined') { value = 'loading ' + this._property + '...' }
		value = value || this._property
		value = value.replace(/\n/g, '<br />')
		value = value.replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
	}
	
	this._onPropertyUpdated = function(newValue) { 
		this._setValue(newValue)
	}
})