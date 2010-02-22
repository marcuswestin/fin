
#################
### Utilities ###
#################

.PHONY: dependencies run run-couchdbx clean

dependencies: jsio node-couchdb ../../lib/node/build/default/node

run:
	cd js/server; ../../lib/node/build/default/node run_server.js

run-couchdbx: lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app
	open lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app &
	sleep 3
	cd js/server; ../../lib/node/build/default/node run_server.js

clean:
	rm -rf __MACOSX/
	rm -rf lib/*
	touch lib/empty.txt



#####################
### Dependencies ####
#####################

.PHONY: jsio node-couchdb

jsio:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout 4c831469774c1709b0e1b62af864d63995f6ed59

node-couchdb:
	git clone git://github.com/marcuswestin/node-couchdb.git
	mv node-couchdb lib/
	cd lib/node-couchdb/; git checkout 9283376d57cff9f3ac3aabf9705dc98b6ecb3a8e

../../lib/node/build/default/node:
	git clone git://github.com/ry/node.git
	# install node v0.1.29
	mv node lib/node
	cd lib/node; git checkout 87d5e5b316a4276bcf881f176971c1a237dcdc7a; ./configure; make;

###############
### Testing ###
###############
.PHONY: run-tests
run-tests:
	cd tests; node run_tests.js



###################
### Development ###
###################
.PHONY: monitor-tests edit-jsio edit-node-couchdb edit-node-growl

monitor-tests:
	cd tests; node monitor_tests.js

edit-init: edit-jsio edit-node-couchdb edit-node-growl

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
.PHONY: install-growl-notify

install-growl-notify:
	git clone git://github.com/marcuswestin/growl-notify.git
	cd growl-notify; sudo ./install.sh;
	rm -rf growl-notify;

lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app:
	curl http://cloud.github.com/downloads/janl/couchdbx-core/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip > CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	unzip CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	rm CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	mv CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app lib/

