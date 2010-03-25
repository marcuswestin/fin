jsio('from shared.javascript import Class, bind')
jsio('import client.caret')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._domTag = 'input'
	this._domType = 'text'
	this._className += ' Input'
	this._expectedType = 'string'
	
	this.init = function() {
		supr(this, 'init', arguments)
		
		this._property = this._propertyChain.pop()
		
		this._element.onfocus = bind(this, '_onFocus')
		this._element.onkeypress = bind(this, '_onKeyPress')
		this._element.onBlur = bind(this, '_onBlur')
	}
	
	this._onFocus = function(e) { 
		this._getItem().requestFocus(bind(this, function(){
			this._element.blur()
			this._onBlur()
		}))
		this._focused = true
		if (this._element.value == this._property) { this._element.value = '' }
	}
	
	this._onBlur = function() {
		this._focused = false 
		if (this._element.value == '') { this._element.value = this._property }
	}
	
	this.setValue = function(value) {
		if (typeof value == 'undefined') { return }
		if (this._focused) { return }
		this._element.disabled = false
		this._element.value = typeof value == this._expectedType ? value : this._property
		if (typeof newValue == 'undefined') { return }
		this._onBlur()
	}
		
	this._onKeyPress = function(e) {
		// TODO: Deal with pasting
		e = e || event
		if (e.metaKey && e.keyCode != this._keys['enter']) { return }
		
		var position = client.caret.getPosition(this._element)
		var selectionLength = position.end - position.start
		var mutation = { position: position.caret - selectionLength }
		
		if (e.keyCode == this._keys['enter']) {
			this._element.blur()
			e.cancel()
			return
		} else if (e.keyCode == this._keys['backspace']) {
			if (selectionLength) {
				mutation.deletion = selectionLength
			} else {
				mutation.position -= 1
				mutation.deletion = 1
			}
		} else if (e.keyCode == this._keys['enter']) {
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
		this._mutateItem(mutation)
	}
	
	this._mutateItem = function(mutation) {
		this._getItem().mutate(mutation)
	}
})