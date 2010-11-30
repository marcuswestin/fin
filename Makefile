################
### Commands ###
################

.PHONY: all
all: fin.js lib/js.io lib/redis-node-client

.PHONY: clean
clean:
	rm -f fin.js
	rm -f *.out
	rm -rf lib/*
	touch lib/empty.txt

.PHONY: run
run: all
	redis-server &> redis-server.out &
	node run_query_observer.js &> node_query_observer.out &
	node run_server.js &> node_server.out &

.PHONY: stop
stop:
	killall node
	killall redis-server

.PHONY: restart
restart: stop run

#####################
### Dependencies ####
#####################

fin.js: Makefile lib/js.io lib/js.io/packages/jsio.js
	echo "// Built in Makefile by lib/js.io rule" > fin.js
	cat lib/js.io/packages/jsio.js | sed s/jsio.js/fin.js/g >> fin.js
	echo "" >> fin.js
	echo ";(function(){" >> fin.js
	echo "	var finPath = jsio.path.get()[0]" >> fin.js
	echo "	jsio.path.set(finPath + '/lib/js.io/packages')" >> fin.js
	echo "	jsio.path.add(finPath + '/js', 'client')" >> fin.js
	echo "	jsio.path.add(finPath + '/js', 'shared')" >> fin.js
	echo "	jsio('import client.api')" >> fin.js
	echo "})()" >> fin.js

lib/js.io:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout d95c99439ce1785dea6402672906e2843d9571ac
	rm -rf lib/js.io/examples

lib/redis-node-client:
	git clone git://github.com/fictorial/redis-node-client.git 
	mv redis-node-client lib/
	# Checks out "works with just-released node v0.1.90"
	cd lib/redis-node-client/; git checkout v0.3.5;

##################
### Utilities ####
##################

.PHONY: install-node
install-node:
	git clone git://github.com/ry/node.git /tmp/fin-node
	cd /tmp/fin-node; git checkout v0.2.3; ./configure; make; sudo make install
	rm -rf /tmp/fin-node

.PHONY: install-redis
install-redis:
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	cd /tmp/fin-redis; git checkout v2.0.2-stable; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
	rm -rf /tmp/fin-redis
