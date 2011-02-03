################
### Commands ###
################
.PHONY: all
all: lib/redis-node-client lib/browser-require lib/socket.io

.PHONY: clean
clean:
	rm -rf lib/*
	touch lib/empty.txt

#####################
### Dependencies ####
#####################
lib/redis-node-client:
	git clone git://github.com/fictorial/redis-node-client.git 
	mv redis-node-client lib/
	# Check out "works with just-released node v0.1.90"
	cd lib/redis-node-client/; git checkout v0.3.5

lib/browser-require:
	git clone git://github.com/marcuswestin/browser-require.git
	mv browser-require lib/
	cd lib/browser-require; git checkout 48e59a6739c812ebf6283d7b1bd975dc2e6d7b96

lib/socket.io:
	git clone git://github.com/LearnBoost/Socket.IO-node.git socket.io
	mv socket.io lib/
	# Check out version 0.6.1
	cd lib/socket.io; git checkout 0.6.1

##################
### Utilities ####
##################
.PHONY: install-node
install-node:
	git clone git://github.com/ry/node.git /tmp/fin-node
	cd /tmp/fin-node; git checkout v0.3.2; ./configure; make; sudo make install
	rm -rf /tmp/fin-node

.PHONY: install-redis
install-redis:
	git clone git://github.com/antirez/redis.git /tmp/fin-redis
	cd /tmp/fin-redis; git checkout v2.0.2-stable; make; sudo cp redis-server /usr/local/bin; sudo cp redis-cli /usr/local/bin;
	rm -rf /tmp/fin-redis
