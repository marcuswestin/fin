var fin = require('../../api/client')

fin.connect('127.0.0.1', 8080, function() {
	var createButton = document.getElementById('create-button'),
		createPropInput = document.getElementById('create-prop-input'),
		createValInput = document.getElementById('create-val-input'),
		subscribeIdInput = document.getElementById('subscribe-itemId'),
		subscribePropInput = document.getElementById('subscribe-property'),
		subscribeButton = document.getElementById('subscribe-button')
		
	createButton.onclick = function() {
		var properties = {},
			propName = createPropInput.value,
			propVal = createValInput.value
			
		properties[propName] = propVal
		fin.create(properties, function(newItemId) {
			var el = demo.createOutput()
			function update(newVal) { el.innerHTML = '<strong>created</strong> item ' + newItemId}
			update(propVal)
			// fin.observe(newItemId, propName, function(mutation) { update(mutation.args[0]) })
		})
	}
	
	subscribeButton.onclick = function() {
		var itemId = subscribeIdInput.value
		var propName = subscribePropInput.value
		demo.subscribeTo(itemId, propName)
	}
	
	createPropInput.onkeyup = function() { 
		createButton.innerHTML = 'fin.create({"'+createPropInput.value+'":"'+createValInput.value+'"})' 
	}
	createValInput.onkeyup = createPropInput.onkeyup
	
	subscribeIdInput.onkeyup = function() { 
		subscribeButton.innerHTML = 'fin.observe('+subscribeIdInput.value+',"'+subscribePropInput.value+'")'
	}
	subscribePropInput.onkeyup = subscribeIdInput.onkeyup
	
	createValInput.onkeyup()
	subscribeIdInput.onkeyup()
})

var demo = {
	createOutput: function() {
		var parent = document.getElementById('output-column')
		var el = parent.insertBefore(document.createElement('div'), parent.childNodes[2])
		el.className = 'header'
		return el
	},
	
	subscribeTo: function(itemId, propName) {
		itemId = parseInt(itemId)
		var el = demo.createOutput()
		el.innerHTML = '<strong>subscribed</strong> to item ' + itemId + ' ' + propName + ' = <input style="width: 100px;"></input>'
		el.className += ' item'
		var input = el.getElementsByTagName('input')[0]
		fin.observe(itemId, propName, function(mutation, newVal) { input.value = newVal })
		input.onkeyup = function() { fin.set(itemId, propName, input.value) }
	}
}
