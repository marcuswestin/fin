Key/Value API
-------------
Create an item
	fin.create({ type: 'user', name: 'marcus', friend:2 }, function(newItemID) { ... })

Subscribe to an item property
	fin.observe(itemID, property, function(mutation) { ... })
	fin.observe(1, 'name', function(mutation, name) { console.log(name) })
	fin.observe(1, 'friend.name', function(mutation, name) { console.log("friend's name is", name) })

Mutate an item property
	fin.set(itemID, property, value)
	fin.set(1, 'name', 'marcus westin')


ORM API
-------
Create your schema
	var fin = require('./api/client'),
		models = require('./api/models')

	models.process({
		"Global": {
			"messages": { id:1, type:'List', of:'Message' }
		},
		"Message": {
			"text": { id:1, type:'Text' },
			"from": { id:2, type:'User' }
		},
		"User": {
			"name": { id:1, type:'Text' },
			"age":  { id:2, type:'Number' }
		}
	})

Instantiate models
	var user = new models.User(1) // user with ID 1
	var message = new models.Message({ text:'Hi!', from:user })
	models.global.messages.push(message)

Observe models
	models.global.messages.on('push', function(message) {
		message.from.name.observe(function(name) { console.log('message from', name) })
		message.text.observe(function(text) { console.log('message text is',  text) })
	})


Getting started
---------------
Fin requires node
	sudo make install-node

Fin also needs some local libraries
	make

Run a demo
	node demo/run-server.js

Fire up your browser to localhost/[path to fin]/demo


Development vs Production
-------------------------
Install redis
	sudo make install-redis
