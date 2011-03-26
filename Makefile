# Commands
##########
build: fin-client.js fin-models-client.js
publish: fin-client.min.js fin-models-client.min.js
	npm publish

# Dependencies
##############
fin-client.js: api/*
	node build.js client

fin-client.min.js: api/*
	node build.js client --compress

fin-models-client.js: api/*
	node build.js models

fin-models-client.min.js: api/*
	node build.js models --compress

# Utilities
###########
clean:
	rm -f fin-client.*
	rm -f fin-models-client.*

install-node:
	git clone git://github.com/ry/node.git /tmp/fin-node
	cd /tmp/fin-node; git checkout v0.4.2; ./configure; make; sudo make install
	rm -rf /tmp/fin-node

install-redis:
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	cd /tmp/fin-redis; git checkout v2.0.2-stable; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
	rm -rf /tmp/fin-redis
