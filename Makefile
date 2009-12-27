
.PHONY: install clean jsio node-couch

install: jsio node-couch

jsio:
	git clone git://github.com/marcuswestin/js.io.git
	mv js.io lib/

node-couch:
	git clone git@github.com:marcuswestin/node-couch.git 
	mv node-couch lib/

clean:
	rm -rf lib/*
	rm -f js/jsio 					# symbolic link
	rm -f js/server/node-couch.js
	touch lib/empty.txt
	
run:
	cd js/server; node app.js