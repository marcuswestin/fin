jsio('from shared.javascript import Class, bind')

exports = Class(function(supr){
	this.init = function(args) {
		var itemId = args[0],
			propName = args[1]
		
		this._element = document.createElement('span')
		
		this._subId = fin.observe(itemId, propName, bind(this, '_onItemMutated'))
		this._setValue('Loading...')
	}
	
	this.release = function() { fin.release(this._subId) }
	
	this.getElement = function() { return this._element }
	
	this._onItemMutated = function(mutation, newValue) { this._setValue(newValue || '') }
	
	this._setValue = function(value) {
		value = value.toString().replace(/\n/g, '<br />').replace(/ $/, '&nbsp;')
		this._element.innerHTML = value
		this._element.className = ' fin-Value-' + this._property + '-' + value.replace(/ /g, '_')
	}
})