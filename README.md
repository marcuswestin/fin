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


Using fin - API
---------------
Get a view of an item
	var viewEl = fin.getView('<div>(( task.dueDate ))</div>', 'item-id')
	document.body.appendChild(viewEl)
	
Get a view of an array (a list)
	fin.getView('<div>(( List names ))</div>', 'item-id')

Create an input field for an item property
	fin.getView('<div>(( name ))</div><div>(( Input name ))</div>', 'item-id')

*Under the hood* - Get an item by id
	var item = fin.getItem('itemId')
	
*Under the hood* - Add a dependant to the user's current task's date. The function will be called right away and when the value changes
	item.addDependant('user.currentTask.date', function(value){ /* render or do something with value */ })

Upcoming API
------------
Get a view using multiple items (not yet supported)
	fin.getView('<div class="dueDate">(( user.task.dueDate ))</div><div class="messageSender">(( message.sender.name ))', 
		{ user: userItem, message: messageItem })

Get a view of a list of items by properties (not yet supported)
	var topPriorityBugsList = fin.getListView('<div class="list-item"> (( priority )) Owner: (( owner.name ))</div>, 
		{ type: 'bug', priority: 1 })


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