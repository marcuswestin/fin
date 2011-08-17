var NODES = require('ui/dom/NODES'),
	fin = require('../lib/orm-api'),
	bind = require('std/bind'),
	delay = require('std/delay')

// Our global variables
var gUser, ROOT

// Alright - let's go!
setupNodes()
setupSchema()
startApp()

function setupNodes() {
	// Expose DIV, SPAN, INPUT, etc...
	NODES.exposeGlobals()
	// Create custom data attribute, e.g. DIV({ data:message.text })
	NODES.attributeHandlers.data = function(dataProperty) {
		// "this" is the node, e.g. the DIV
		if (this._tag == 'INPUT') {
			this.on('focus', bind(this, function() { this._focused = true }))
			this.on('blur', bind(this, function() { this._focused = false }))
			this.on('keypress', delay(bind(this, function() {
				var value = this.getElement().value
				if (dataProperty.type == 'Number') { value = parseFloat(value, 0) }
				dataProperty.set(value)
			}), 10))
			dataProperty.observe(bind(this, function(value) {
				if (this._focused) { return }
				this.getElement().value = value
			}))
		} else {
			dataProperty.observe(bind(this, function(value) {
				this.getElement().innerHTML = value
			}))
		}
	}
}

function setupSchema() {
	// The chat app data schema
	fin.orm.process({
		"Global": {
			"messages": { id:1, type:"List", of:"Message" }
		},
		"Message": {
			"text": { id:1, type:"Text" },
			"from": { id:2, type:"User" }
		},
		"User": {
			"name": { id:1, type:"Text" },
			"age": { id:2, type:"Number" }
		}
	})
}

function startApp() {
	ROOT = DIV('root').appendTo(document.body)

	var connectingMessageNode
	ROOT.append(
		connectingMessageNode = DIV('connecting', 'connecting...')
	)
	
	fin.connect(function() {
		connectingMessageNode.remove()
		onConnected()
	})
}

function onConnected() {
	gUser = new fin.orm.User({ name: "Guest", age: 25 })
	
	ROOT.append(
		DIV('top',
			DIV('title', 'chat with fin'),
			DIV('user',
				LABEL({ 'for':'nameInput' }, 'your name:'), INPUT({ data:gUser.name, id:'nameInput' }),
				LABEL({ 'for':'ageInput'}, 'your age:'), INPUT({ data:gUser.age, id:'ageInput' }),
				LABEL({ 'for':'messageInput'}, 'send:'), INPUT({ keypress:onKeyPress, id:'messageInput' })
			)
		)
	)
	
	function onKeyPress(e) {
		if (e.keyCode != 13) { return } // Wait for Enter keypress
		var message = new fin.orm.Message({ from:gUser, text:this._el.value })
		fin.orm.global.messages.push(message)
		this._el.value = ''
	}

	var messagesNode = DIV('messages').appendTo(ROOT)
	fin.orm.global.messages.on('push', function(message) {
		DIV('message',
			DIV('sender',
				SPAN('name', { data:message.from.name }),
				' (', SPAN('age', { data:message.from.age }), ')', 
				' says:'
			),
			INPUT('text', { data:message.text })
		).appendTo(messagesNode)
	})
}
