
.PHONY: init clean jsio node-couch

init: jsio node-couch

run:
	cd js/server; node app.js

clean:
	rm -rf lib/*
	touch lib/empty.txt

### lib dependencies
####################

jsio:
	git clone git://github.com/marcuswestin/js.io.git
	mv js.io lib/

node-couch:
	git clone git://github.com/marcuswestin/node-couch.git
	mv node-couch lib/



# Use init-edit for write-access versions of all lib imports
init-edit: jsio-edit node-couch-edit

jsio-edit:
	git clone git@github.com:marcuswestin/js.io.git
	mv js.io lib/

node-couch-edit:
	git clone git@github.com:marcuswestin/node-couch.git
	mv node-couch lib/
