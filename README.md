Realtime templating language
============================

In fin, if you say 
	
	<div>
		<span> Name: (( name )) </span>
		<br/>(( Input name ))
	</div>

then "name" in the span will update at every key stroke in the name Input. On all computers.

Getting started
--------------

(Fin is alpha, unversioned and unstable, but very actively developed)

This setup process has been tested on OS X 10.6

*	fin requires node v0.1.29. To install it, run

	<code>sudo make install-node</code>

*	Download and builds dependencies

	<code>make deps</code>

*	If you don't have couchdb installed and running, you can just run it with couchdbx (snow leopard only)

	<code>make run-couchdbx</code>

*	If you already have couchdb running on localhost:5555

	<code>make run</code>
	
*	fin! Open up a browser to http://localhost/path/to/fin/examples


Using fin (javascript)
----------------------
Get an item by id
	var item = fin.getItem('itemId')
	
Get a view of an item
	var viewEl = fin.getView('<div>(( task.dueDate ))</div>', item)
	document.body.appendChild(viewEl)
	
Get a view using multiple items
	fin.getView('<div class="dueDate">(( user.task.dueDate ))</div><div class="messageSender">(( message.sender.name ))', {
		user: userItem,
		message: messageItem
	})

Get a view of an array (a list)
	fin.getView('<div>(( List names ))</div>', item)

Create an input field for an item property
	fin.getView('<div>(( name ))</div><div>(( Input name ))</div>', item)
	
add a dependant to the user's current task's date's time. The function will be called right away, as well as when the value changes
	item.addDependant('user.currentTask.date.time', function(value){ /* render or do something with value */ })


Writing custom fin views
------------------------
You can write your own views (e.g. Input, List, Value) by adding them to js/browser/views/NAME.js 
Value, for example, goes something like

	See view files in fin/js/browser/views/

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