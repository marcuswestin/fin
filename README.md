Realtime templating language
============================

In fin, if you say 
	
	<div>
		<span> Name: (( name )) </span>
		<br/>(( Input name ))
	</div>

then "name" in the span will update at every key stroke in the name Input. On all computers.

Requirements
------------
Node 0.1.31
Redis 1.2.0


Getting started on OS X 10.6
--------------
Make sure you have node requirements installed and redis-server running locally

Download dependencies

	make deps

Start up CouchDB
	
	make run-couchdbx

Start up fin
	
	make run

Fire up a browser and navigate to localhost/path/to/fin/examples

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

*Under the hood* - Get a set of items, and react to items entering or leaving the set
	var itemSet = fin.getItemSet({ type: 'bug', assigned_to: 'marcus', priority: ['>', 4] })
	itemSet.subscribe('Mutated', function(mutation) {
		if (mutation.added) { console.log(mutation.added, 'was added to the set') }
		if (mutation.removed) { console.log(mutation.removed, 'was removed from the set') }
	})


Upcoming API
------------

Get a view of a list of items by properties (not yet supported)
	var topPriorityBugsList = fin.getListView('<div class="list-item"> (( priority )) Owner: (( owner.name ))</div>, 
		{ type: 'bug', priority: ['>', 3] })


Writing custom fin views
------------------------
You can write your own views (e.g. Input, List, Value) by adding them to js/browser/views/NAME.js 
Value, for example, goes something like

	See view files in fin/js/browser/views/

