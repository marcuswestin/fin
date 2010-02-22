Realtime templating language
============================

In fin, if you say 
	
	<div>
		<span> Name: (( name )) </span>
		<br/>(( Input name ))
	</div>

then "name" in the span will update at every key stroke in the name Input. In any browser.

Getting started
--------------

*	If you don't have node.js installed

	<code>sudo make install-node</code>

*	Load dependencies

	<code>make init</code>

*	If you don't have couchdb installed and running and you use snow leopard

	<code>make run-couchdbx</code>

*	If you do have couchdb running on localhost:5555 already

	<code>make run</code>
	
*	Open a browser and navigate to localhost/path/to/fin/examples


Running tests
-------------

To run the tests
	make run-tests

Developing fin
--------------

To check out editable versions of dependencies
	make edit-init

To have tests fun automatically every time you change a file
	make edit-init
	make monitor-tests