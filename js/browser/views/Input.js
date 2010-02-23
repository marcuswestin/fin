jsio('from common.javascript import Class, bind')
jsio('import browser.events as events')
jsio('import browser.caret')
jsio('import browser.keyboard')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._domType = 'input'
	
	this.init = function(item, args) {
		supr(this, 'init', arguments)
		
		this._propertyChain = this._name.split('.')
		this._name = this._propertyChain.pop()
		
		events.add(this._element, 'focus', bind(this, '_onFocus'))
		events.add(this._element, 'keypress', bind(this, '_onKeyPress'))
		events.add(this._element, 'blur', bind(this, '_onBlur'))
	}
	
	this.getElement = function() {
		return this._element
	}
	
	this._setValue = function(value) {
		this._element.value = typeof value == 'string' ? value : this._name
	}
	
	this._onFocus = function() { 
		this._focused = true
		if (this._element.value == this._name) { this._element.value = '' }
	}
	this._onBlur = function() { 
		this._focused = false 
		if (this._element.value == '') { this._element.value = this._name }
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
		if (e.metaKey && e.keyCode != events.keyCodes['enter']) { return }
		
		var position = browser.caret.getPosition(this._element)
		var selectionLength = position.end - position.start
		var mutation = { position: position.caret - selectionLength }
		
		if (e.keyCode == events.keyCodes['enter'] && !browser.keyboard.shiftIsDown()) {
			this._element.blur()
			events.cancel(e)
			return
		} else if (e.keyCode == events.keyCodes['backspace']) {
			if (selectionLength) {
				mutation.deletion = selectionLength
			} else {
				mutation.position -= 1
				mutation.deletion = 1
			}
		} else if (e.keyCode == events.keyCodes['enter']) {
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
		
		mutation.property = this._name
		this._item.getChainedItem(this._propertyChain).mutate(mutation)
	}
})