jsio('from common.javascript import Class, bind')

exports = Class(function(supr){
	
	this._domType = 'span'
	
	this.init = function(item, args) {
		this._element = document.createElement(this._domType)
		this._item = item
		this._name = args[0]
		
		this._item.addDependant(this._name, bind(this, '_onPropertyUpdated'))
	}
	
	this.getElement = function() { return this._element }
	
	this._setValue = function(value) {
		if (typeof value == 'undefined') { value = 'loading ' + this._name + '...' }
		value = value || this._name
		value = value.replace(/\n/g, '<br />')
		value = value.replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
	}
	
	this._onPropertyUpdated = function(newValue) { 
		this._setValue(newValue)
	}
})