jsio('from common.javascript import Class, bind')
jsio('import browser.caret')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._domType = 'input'
	
	this.init = function() {
		supr(this, 'init', arguments)
		
		this._propertyChain = this._property.split('.')
		this._property = this._propertyChain.pop()
		
		this._element.onfocus = bind(this, '_onFocus')
		this._element.onkeypress = bind(this, '_onKeyPress')
		this._element.onBlur = bind(this, '_onBlur')
	}
	
	this.getElement = function() {
		return this._element
	}
	
	this._setValue = function(value) {
		this._element.value = typeof value == 'string' ? value : this._property
	}
	
	this._onFocus = function() { 
		this._focused = true
		if (this._element.value == this._property) { this._element.value = '' }
	}
	this._onBlur = function() { 
		this._focused = false 
		if (this._element.value == '') { this._element.value = this._property }
	}
	
	this._onPropertyUpdated = function(newValue) {
		if (typeof newValue == 'undefined') { 
			this._onBlur()
			return
		}
		if (this._focused) { return }
		this._element.disabled = false
		this._setValue(newValue)
		if (typeof newValue == 'undefined') { return }
		this._onBlur()
	}
	
	this._onKeyPress = function(e) {
		// TODO: Deal with pasting
		e = e || event
		var keys = { 'enter': 13, 'backspace': 8 }
		if (e.metaKey && e.keyCode != keys['enter']) { return }
		
		var position = browser.caret.getPosition(this._element)
		var selectionLength = position.end - position.start
		var mutation = { position: position.caret - selectionLength }
		
		var shiftIsDown = false // we need to know if the shift key is down to enable adding breaklines :(
		if (e.keyCode == keys['enter'] && !shiftIsDown) {
			this._element.blur()
			e.cancel()
			return
		} else if (e.keyCode == keys['backspace']) {
			if (selectionLength) {
				mutation.deletion = selectionLength
			} else {
				mutation.position -= 1
				mutation.deletion = 1
			}
		} else if (e.keyCode == keys['enter']) {
			mutation.addition = "\n"
			if (selectionLength) {
				mutation.deletion = selectionLength
			}
		} else if (e.charCode) {
			mutation.addition = String.fromCharCode(e.charCode)
			if (selectionLength) {
				mutation.deletion = selectionLength
			}
		}
		
		// Don't publish no op mutations
		if (!mutation.deletion && !mutation.addition) { return }
		
		mutation.property = this._property
		this._item.getChainedItem(this._propertyChain).mutate(mutation)
	}
})