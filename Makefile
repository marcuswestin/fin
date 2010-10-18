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
	echo "	var finPath = jsio.__path.__default__" >> fin.js
	echo "	jsio.setPath(finPath + 'lib/js.io/packages')" >> fin.js
	echo "	jsio.addPath(finPath + 'js', 'client')" >> fin.js
	echo "	jsio.addPath(finPath + 'js', 'shared')" >> fin.js
	echo "	jsio('import client.api')" >> fin.js
	echo "})()" >> fin.js

lib/js.io:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout 964e26904fe3f091348f890329adaed44341cba8
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
	rm -rf /tmp/fin-node
	git clone git://github.com/ry/node.git /tmp/fin-node
	cd /tmp/fin-node; git checkout v0.2.3; ./configure; make; sudo make install


.PHONY: install-redis
install-redis:
	rm -rf /tmp/fin-redis
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	cd /tmp/fin-redis; git checkout v2.0.2-stable; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
