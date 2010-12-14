API
---

Create an item
	fin.create({ type: 'user', name: 'marcus' }, function(newItemId) { ... })

Subscribe to an item property
	fin.observe(itemId, propertyName, function(mutation) { ... })

Mutate an item property
	fin.set(itemId, propertyName, value)

Getting started
---------------

Fin requires node and redis
	sudo make install-node
	sudo make install-redis

Fin also needs some local libraries
	make

Run redis server and fin server
	redis-server redis.conf
	node run_server.js

or just
    make run

Finally, fire up your browser to localhost/[path to fin]/demo

Running tests
-------------
Go through the "Getting started" steps above to get fin up and running. Then run the tests:
	cd test
	node run_tests.js
