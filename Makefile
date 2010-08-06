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

fin.js: Makefile lib/js.io
	echo "// Built in Makefile by lib/js.io rule" > fin.js
	cat lib/js.io/packages/jsio.js | sed s/jsio.js/fin.js/g >> fin.js
	echo "" >> fin.js
	echo "void(function(){" >> fin.js
	echo "var path = jsio.path.__default__[0]" >> fin.js
	echo "if (!path.match(/\/$$/)) { jsio.path.__default__[0] = (path += '/') }" >> fin.js
	echo "jsio.path.client = jsio.path.__default__ + 'js'" >> fin.js
	echo "jsio.path.shared = jsio.path.__default__ + 'js'" >> fin.js
	echo "jsio.path.__default__ += 'lib/js.io/packages'" >> fin.js
	echo "jsio('import client.api')" >> fin.js
	echo "})();" >> fin.js

lib/js.io:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout 917fb816fd07c18a401a9af551dd043bc7886a77
	rm -rf lib/js.io/examples

lib/redis-node-client:
	git clone git://github.com/fictorial/redis-node-client.git 
	mv redis-node-client lib/
	# Checks out "works with just-released node v0.1.90"
	cd lib/redis-node-client/; git checkout abf4c4bf4c3f13873fe65b45ddee664066e442dd

##################
### Utilities ####
##################

.PHONY: install-node
install-node:
	rm -rf /tmp/fin-node
	git clone git://github.com/ry/node.git /tmp/fin-node
	# installs node version 0.1.90
	cd /tmp/fin-node; git checkout 07e64d45ffa1856e824c4fa6afd0442ba61d6fd8; ./configure; make; sudo make install


.PHONY: install-redis
install-redis:
	rm -rf /tmp/fin-redis
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	# installs redis version 1.3.10 to /usr/local/bin
	cd /tmp/fin-redis; git checkout 24df76987e85f7ba5314495e50dc5cc9ff623823; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
