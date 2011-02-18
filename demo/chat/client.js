// This is what we want - it doesn't work yet :)

var fin = require('../../api/client'),
	models = require('../../api/models')

var user = null,
	$ = function(id) { return document.getElementById(id) }

models.process({
	"User": {
		"name": { id:1, type:"Text" },
		"age": { id:2, type:"Number" }
	},
	"Message": {
		"text": { id:1, type:"Text" },
		"from": { id:2, type:"User" }
	},
	"Global": {
		"messages": { id:1, type:"List", of:"Message" }
	}
})

fin.connect(function() {
	$('connecting').style.display = 'none'
	$('loginForm').style.display = 'block'
})

$('login').onclick = function() {
	user = new models.User({ name: $('username').value, age: 25 }).create()
	$('username').onchange = function(value) { user.name.set(value) }
	$('chat').style.display = 'block'
}

models.global.messages.on('add', function(message) {
	var div = $('messages').appendChild(document.createElement('div')),
		sender = div.appendChild(document.createElement('div')),
		messageInput = div.appendChild(document.createElement('input'))
	
	message.from.name.observe(function(value) { sender.innerHTML = value + ':' })
	
	message.text.observe(function(value) { input.value = value })
	input.onchange = function(value) { message.text.set(value) }
})
