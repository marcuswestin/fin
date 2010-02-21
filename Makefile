
#################
### Utilities ###
#################

.PHONY: init init-couchdbx run clean

init: jsio node-couchdb

run:
	cd js/server; node run_server.js

run-couchdbx: lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app
	open lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app &
	sleep 3
	cd js/server; node run_server.js

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

node-couchdb:
	git clone git://github.com/marcuswestin/node-couchdb.git
	mv node-couchdb lib/



###############
### Testing ###
###############
.PHONY: test 
test:
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
.PHONY: install-couchdbx-snow-leopard

install-growl-notify:
	git clone git://github.com/marcuswestin/growl-notify.git
	cd growl-notify; sudo ./install.sh;
	rm -rf growl-notify;

install-node:
	git clone git://github.com/ry/node.git
	cd node; ./configure; make; sudo make install
	rm -rf node;

lib/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app:
	curl http://cloud.github.com/downloads/janl/couchdbx-core/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip > CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	unzip CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	rm CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	mv CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app lib/

