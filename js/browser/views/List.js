jsio('from common.javascript import Class, bind')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._setValue = function(items) {
		if (typeof items == 'string') {
			this.innerHTML = ''
		} else {
			this._items = items
			this._render()
		}
	}
	
	this._render = function() {
		this._element.innerHTML = ''
		if (!this._items || !this._items.length) { return }
		for (var i=0, item; itemValue = this._items[i]; i++) {
			// allow reverse lookup of position
			if (typeof itemValue == 'number') { itemValue = String(itemValue) }
			this._items[itemValue] = i
			this._renderItem(itemValue)
		}
	}
	
	this._renderItem = function(itemValue) {
		var el = this._element.appendChild(document.createElement('div'))
		el.style.position = 'relative'
		
		var text = el.appendChild(document.createElement('div'))
		el.appendChild(document.createTextNode(itemValue))
		
		function createArrow(self, direction) {
			var arrow = el.appendChild(document.createElement('div'))
			arrow.style.position = 'absolute'
			arrow.style.left = '-10px'
			arrow.style.cursor = 'pointer'
			arrow.style.fontSize = '9px'
			arrow.style.top = (direction == 1 ? '7px' : '3px')
			arrow.appendChild(document.createTextNode(direction == 1 ? 'v' : '^'))
			arrow.onclick = bind(self, '_moveItem', itemValue, direction)
		}
		
		createArrow(this, -1)
		createArrow(this, 1)
	}
	
	this._moveItem = function(itemValue, delta) {
		var current = this._items[itemValue]
		var next = current + delta
		var mutation = { property: this._property, from: current, to: next }
		this._item.mutate(mutation)
	}
	
	this._onPropertyUpdated = function(newItems) { 
		this._setValue(newItems)
	}
})