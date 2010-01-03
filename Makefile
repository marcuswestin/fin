
.PHONY: install clean jsio node-couch

install: jsio node-couch

run:
	cd js/server; node app.js

clean:
	rm -rf lib/*
	rm -f js/jsio 					# symbolic link
	rm -f js/server/node-couch.js
	touch lib/empty.txt

### lib dependencies
####################

jsio:
	git clone git://github.com/marcuswestin/js.io.git
	mv js.io lib/

node-couch:
	git clone git://github.com/marcuswestin/node-couch.git
	mv node-couch lib/



# Use install-edit for write-access versions of all lib imports

install-edit: jsio-edit node-couch-edit

jsio-edit:
	git clone git@github.com:marcuswestin/js.io.git
	mv js.io lib/

node-couch-edit:
	git clone git@github.com:marcuswestin/node-couch.git
	mv node-couch lib/
