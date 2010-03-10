
#################
### Utilities ###
#################

.PHONY: dependencies run run-couchdbx clean

deps: jsio node-couchdb redis-node-client

run:
	cd js/server; node run_server.js

run-couchdbx: lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app
	open lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app &
	sleep 3
	cd js/server; node run_server.js

clean:
	rm -rf lib/*
	touch lib/empty.txt



#####################
### Dependencies ####
#####################

.PHONY: jsio node-couchdb redis-node-client

jsio:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout f4a9d4939201992173f1612db972e04adf01c6ed

node-couchdb:
	git clone git://github.com/felixge/node-couchdb.git
	mv node-couchdb lib/
	cd lib/node-couchdb/; git checkout cb4d08b727f1dc47ee82170bb3b644783d445f68

redis-node-client:
	git clone git://github.com/fictorial/redis-node-client.git
	mv redis-node-client lib/
	cd lib/redis-node-client/; git checkout e7a11ce67883919210f03c998b7cdc9b349daf2d

###############
### Testing ###
###############
.PHONY: run-tests
run-tests:
	cd tests; node run_tests.js



###################
### Development ###
###################
.PHONY: monitor-tests edit-deps edit-jsio edit-node-couchdb edit-node-growl

monitor-tests:
	cd tests; node monitor_tests.js

edit-deps: edit-jsio edit-node-couchdb edit-node-growl

edit-jsio:
	git clone git@github.com:mcarter/js.io.git
	mv js.io lib/

edit-node-couchdb:
	git clone git@github.com:marcuswestin/node-couchdb.git
	mv node-couchdb lib/

edit-node-growl:
	git clone git@github.com:marcuswestin/node-growl.git
	mv node-growl lib/



#######################
### Install helpers ###
#######################
.PHONY: install-node install-growl-notify

install-node:
	git clone git://github.com/ry/node.git
	# install node v0.1.29
	mv node lib/node
	cd lib/node; git checkout 87d5e5b316a4276bcf881f176971c1a237dcdc7a; ./configure; make; sudo make install;
	rm -rf lib/node;

install-growl-notify:
	git clone git://github.com/marcuswestin/growl-notify.git
	cd growl-notify; sudo ./install.sh;
	rm -rf growl-notify;

lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app:
	curl http://cloud.github.com/downloads/janl/couchdbx-core/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip > CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	unzip CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	rm -rf CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip __MACOSX/
	mv CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app lib/
