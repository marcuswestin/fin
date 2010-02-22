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

(Fin is alpha, unversioned and unstable, but very actively developed)

This setup process has been tested on OS X 10.6

*	Download and builds dependencies

	<code>make dependencies</code>

*	If you don't have couchdb installed and running, you can just run it with couchdbx (snow leopard only)

	<code>make run-couchdbx</code>

*	If you already have couchdb running on localhost:5555

	<code>make run</code>
	
*	fin! Open up a browser to http://localhost/path/to/fin/examples


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