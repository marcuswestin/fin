jsio('from common.javascript import Class, bind')

exports = Class(function(supr){
	
	this._domType = 'div'
	
	this.init = function(item, args) {
		this._element = document.createElement(this._domType)
		this._item = item
		this._name = args[0]
		
		var value = this._item.getProperty(this._name)
		if (typeof value == 'undefined') {
			this._setValue('loading ' + this._name + '...')
		} else {
			this._setValue(value)
		}
		
		this._item.subscribeToProperty(this._name, bind(this, '_onPropertyUpdated'))
	}
	
	this.getElement = function() { return this._element }
	
	this._setValue = function(value) {
		value = value || this._name
		value = value.replace(/\n/g, '<br />')
		value = value.replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
	}
	
	this._onPropertyUpdated = function(newValue) { 
		this._setValue(newValue)
	}
})