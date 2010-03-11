Realtime templating language
============================

In fin, if you say 
	
	<div>
		<span> Name: (( name )) </span>
		<br/>(( Input name ))
	</div>

then "name" in the span will update at every key stroke in the name Input. On all computers.

Getting started on OS X 10.6
--------------

Fin is alpha, unversioned and unstable. It is currently developed and tested only on OS X 10.6. 

	sudo make install-node #install node v0.1.29
	make deps #download all js dependencies
	make run-couchdbx #run fin using a local instance of couchdbx
	# Fire up a browser and navigate to localhost/path/to/fin/examples
	
If you already have couchdb running on localhost:5555, replace <code>make run-couchdbx</code> with <code>make run</code>

To get fin to run on OS X 10.5 you'd probably only need to replace the reference to CouchDBX for OS X 10.6 with the version for OS X 10.5 in Makefile 

Using fin - API
---------------
Get a view of an item
	var viewEl = fin.getView('<div>(( task.dueDate ))</div>', 'item-id')
	document.body.appendChild(viewEl)
	
Get a view of an array (a list)
	fin.getView('<div>(( List names ))</div>', 'item-id')

Create an input field for an item property
	fin.getView('<div>(( name ))</div><div>(( Input name ))</div>', 'item-id')

Get a view using multiple items
	fin.getView('<div class="dueDate">(( user.task.dueDate ))</div><div class="messageSender">(( message.sender.name ))', 
		{ user: userItem, message: messageItem })

*Under the hood* - Get an item by id
	var item = fin.getItem('itemId')
	
*Under the hood* - Add a dependant to the user's current task's date. The function will be called right away and when the value changes
	item.addDependant('user.currentTask.date', function(value){ /* render or do something with value */ })

Upcoming API
------------

Get a view of a list of items by properties (not yet supported)
	var topPriorityBugsList = fin.getListView('<div class="list-item"> (( priority )) Owner: (( owner.name ))</div>, 
		{ type: 'bug', priority: 1 })


Writing custom fin views
------------------------
You can write your own views (e.g. Input, List, Value) by adding them to js/browser/views/NAME.js 
Value, for example, goes something like

	See view files in fin/js/browser/views/

