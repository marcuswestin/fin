################
### Commands ###
################

.PHONY: deps
deps: lib/js.io lib/redis-node-client

.PHONY: run
run:
	cd js/server; node run_server.js

.PHONY: clean
clean:
	rm -rf lib/*
	touch lib/empty.txt



#####################
### Dependencies ####
#####################

lib/js.io:
	git clone git://github.com/mcarter/js.io.git
	mv js.io lib/
	cd lib/js.io/; git checkout 39965139b49921be14188eb4fece7c5a42702397

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
