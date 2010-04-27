API
---

Create an item
	fin.create({ type: 'user', name: 'marcus' }, function(newItemId) { ... })

Query for items
	fin.query({ type: 'user' }, function(mutation) { ... })

Subscribe to an item property
	fin.subscribe(itemId, propertyName, function(mutation) { ... })

Mutate an item property
	fin.set(itemId, propertyName, value)

Getting started
---------------

Fin requires node and redis
	sudo make install-node
	sudo make install-redis

Fin also needs some local libraries
	make lib/js.io
	make lib/redis-node-client

Run redis server, fin server, and fin query observer
	# Start redis
	redis-server redis.conf &
	# Start a fin server
	node run_server.js &
	# Start a fin query observer
	node run_query_observer.js &

Fire up a browser to localhost/[path to fin]/demo
