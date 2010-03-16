.PHONY: run run-couchdbx clean

################
### Commands ###
################

deps: lib/js.io lib/node-couchdb lib/redis-node-client lib/CouchDBX.app

run:
	cd js/server; node run_server.js

run-couchdbx: 
	open lib/CouchDBX.app &

clean:
	rm -rf lib/*
	touch lib/empty.txt



#####################
### Dependencies ####
#####################

lib/js.io:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout 3bfa0b33d02fadf29d5d1ee4605f8a9a1a5cdf9f 
	# previous known stable at f4a9d4939201992173f1612db972e04adf01c6ed

lib/node-couchdb:
	git clone git://github.com/felixge/node-couchdb.git
	mv node-couchdb lib/
	cd lib/node-couchdb/; git checkout cb4d08b727f1dc47ee82170bb3b644783d445f68

lib/redis-node-client:
	git clone git://github.com/fictorial/redis-node-client.git 
	mv redis-node-client lib/
	cd lib/redis-node-client/; git checkout e7a11ce67883919210f03c998b7cdc9b349daf2d

lib/CouchDBX.app:
	curl http://cloud.github.com/downloads/janl/couchdbx-core/CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip > CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	unzip CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip
	rm -rf CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.zip __MACOSX/
	mv CouchDBX-0.10.1-R13b02-64bit-Snow-Leopard.app lib/CouchDBX.app
