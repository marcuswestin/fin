var fin = require('../../api/client'),
	models = require('../../api/models')

var user = null,
	$ = function(id) { return document.getElementById(id) }

models.process({
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

fin.connect('127.0.0.1', 8080, function() {
	hide($('connecting'))
	show($('user'))
})

$('login').onclick = function() {
	user = new models.User({ name: $('username').value, age: 25 })
	hide($('login'))
	show($('online'))
	reflectProperty($('username'), user.name)
	user.name.observe(function(name) { $('status').innerHTML = 'Online as "'+name+'"' })
}

$('send').onclick = function() {
	var message = new models.Message({ from:user, text:$('message').value })
	models.global.messages.push(message)
	$('message').value = ''
}

models.global.messages.on('push', function(message) {
	var div = $('messages').appendChild(document.createElement('div')),
		sender = div.appendChild(document.createElement('div')),
		messageInput = div.appendChild(document.createElement('input'))
	
	message.from.name.observe(function(value) { sender.innerHTML = value + ':' })
	
	reflectProperty(messageInput, message.text)
})

function reflectProperty(input, property) {
	property.observe(function(value) { input.value = value })
	var lastValue = input.value
	input.onkeypress = function() { setTimeout(function() {
		if (input.value == lastValue) { return }
		lastValue = input.value
		property.set(input.value)
	}, 0)}
}

function show(el) { el.style.display = 'block' }
function hide(el) { el.style.display = 'none' }
