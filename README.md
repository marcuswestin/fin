Getting started
---------------
Install fin
	npm install fin

Run a demo
	node demo/run-server.js
	# Now fire up your browser to localhost/[path to fin]/demo

Key/Value API
-------------
	<script src="fin-client.min.js"></script>
	<script>
	fin.connect('localhost', 8080, function() {
		// Create an item
		fin.create({ type: 'user', name: 'marcus', friend:2 }, function(newItemID) { ... })
		
		// Subscribe to an item property
		fin.observe(itemID, property, function(mutation) { ... })
		fin.observe(1, 'name', function(mutation, name) { console.log(name) })
		fin.observe(1, 'friend.name', function(mutation, name) { console.log("friend's name is", name) })

		// Mutate an item property
		fin.set(itemID, property, value)
		fin.set(1, 'name', 'marcus westin')
	})
	</script>

ORM API
-------
	<script src="fin-models-client.min.js"></script>
	<script>
	fin.connect('localhost', 8080, function() {
		// Declare schema
		fin.models.process({
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

		// Instantiate models
		var user = new fin.models.User(1) // user with ID 1
		var message = new fin.models.Message({ text:'Hi!', from:user })
		fin.models.global.messages.push(message)
		
		// Observe model properties
		fin.models.global.messages.on('push', function(message) {
			message.from.name.observe(function(name) { console.log('message from', name) })
			message.text.observe(function(text) { console.log('message text is',  text) })
		})
	</script>

Engines
-------
Fin uses pluggable engines for storage and pubsub. You can build your own engine, or use one that comes with fin.
	
	var fin = require('fin'),
		engine = require('fin/engines/development')
	fin.start(engine)

The "development" engine holds all data and handles subscriptions in node process memory. It's great for development since you do not need to install a storage system and a pubsub system to get started. In production, you should use a more scalable engine, e.g. the redis engine:

Install redis
	sudo make install-redis
Start redis server
	redis-server
Start fin server
	var fin = require('fin'), redisEngine = require('fin/engines/development')
	fin.start(redisEngine)
