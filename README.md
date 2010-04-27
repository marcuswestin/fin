This README is wildly out of date as of April 13th
All the templating views are being moved to fan, just leaving the realtime pubsub/query and template construction in fin

Create an item
	fin.create({ type: 'user', name: 'marcus' }, function(newItemId) { ... })

Query for items
	fin.query({ type: 'user' }, function(mutation) { ... })

Subscribe to an item property
	fin.subscribe(itemId, propertyName, function(mutation) { ... })

Mutate an item property
	fin.set(itemId, propertyName, value)

Getting started
--------------

Fin requires node and redis
	sudo make install-node
	sudo make install-redis

Fin also needs some local libraries
	make lib/js.io
	make lib/redis-node-client

Run fin
	# Start redis
	redis-server redis.conf &;
	# Start a fin server
	node run_server.js &;
	# Start a fin query observer		
	node run_query_observer &;

Fire up a browser to localhost/[path to fin]/demo
