jsio('from common.javascript import Class, bind')
jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import .Value as Value')

exports = Class(Value, function(supr){
	
	this._setValue = function(items) {
		if (typeof items == 'string') {
			this.innerHTML = '';
		} else {
			this._items = items
			this._render(items)
		}
	}
	
	this._render = function() {
		this._element.innerHTML = ''
		for (var i=0, item; itemValue = this._items[i]; i++) {
			// allow reverse lookup of position
			if (typeof itemValue == 'number') { itemValue = String(itemValue) }
			this._items[itemValue] = i
			this._renderItem(itemValue)
		}
	}
	
	this._renderItem = function(itemValue) {
		var el = dom.create({ parent: this._element, style: { position: 'relative' } })
		var text = dom.create({ parent: el, text: itemValue })

		var style = { position: 'absolute', left: -10, cursor: 'pointer', fontSize: 9, top: 3 }
		var up = dom.create({ parent: el, style: style, text: '^' })
		style.top = 7
		var down = dom.create({ parent: el, style: style, text: 'v' })
		
		events.add(up, 'click', bind(this, '_moveItem', itemValue, -1))
		events.add(down, 'click', bind(this, '_moveItem', itemValue, 1))
	}
	
	this._moveItem = function(itemValue, delta) {
		var current = this._items[itemValue]
		var next = current + delta
		var mutation = { property: this._name, from: current, to: next }
		this._item.mutate(mutation)
	}
	
	this._onPropertyUpdated = function(newItems) { 
		this._setValue(newItems)
	}
})