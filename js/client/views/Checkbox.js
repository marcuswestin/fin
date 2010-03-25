jsio('from shared.javascript import Class, bind')
jsio('import client.caret')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._domTag = 'input'
	this._domType = 'checkbox'
	this._className += ' Checkbox'
	this._expectedType = 'boolean'
	
	this.init = function() {
		supr(this, 'init', arguments)
		
		this._property = this._propertyChain.pop()
		
		this._element.onclick = bind(this, '_checkValue')
		this._element.onkeypress = bind(this, '_checkValue')
	}
	
	this.setValue = function(value) {
		if (typeof value == 'undefined') { return }
		this._element.checked = Boolean(value)
	}

	this.createDelayedMethod('_checkValue', function() {
		var isChecked = this._element.checked,
			item = this._getItem(),
			shouldBeChecked = Boolean(item.getProperty(this._property))
		if (isChecked != shouldBeChecked) {
			item.mutate({ property: this._property, value: isChecked })
		}
	})
})