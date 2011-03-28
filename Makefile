# Commands
##########
clients: build/fin-client.js build/fin-models-client.js
compress: build/fin-client.min.js build/fin-models-client.min.js

publish: clients compress
	npm publish

# Dependencies
##############
build/fin-client.js: api/*
	node build/build.js client
build/fin-client.min.js: api/*
	node build/build.js client --compress
build/fin-models-client.js: api/*
	node build/build.js models
build/fin-models-client.min.js: api/*
	node build/build.js models --compress

# Utilities
###########
clean:
	rm -f build/fin-*client.js

install-node:
	git clone git://github.com/ry/node.git /tmp/fin-node
	cd /tmp/fin-node; git checkout v0.4.2; ./configure; make; sudo make install
	rm -rf /tmp/fin-node

install-redis:
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	cd /tmp/fin-redis; git checkout v2.0.2-stable; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
	rm -rf /tmp/fin-redis
