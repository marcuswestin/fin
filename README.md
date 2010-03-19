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

Fin requires node and redis. I suggest you install them both with brew.

	# Install brew
	sudo chown -R $USER /usr/local
	curl -Lsf http://github.com/mxcl/homebrew/tarball/master | tar xvz -C/usr/local --strip 1
	
	# Brew node and redis
	brew install redis
	brew install node

Download dependencies (js.io, node-couchdb, redis-node-client, CouchDBX)

	make deps

Start up databases
	
	make run-dbs

Start up fin
	
	make run

Fire up a browser and navigate to localhost/path/to/fin/examples

Using fin - API
---------------
Apply a template to an item
	var viewEl = fin.applyTemplate('<div>(( task.dueDate ))</div>', 'item-id')
	document.body.appendChild(viewEl)
	
Create an input field for an item property
	fin.applyTemplate('<div>(( name ))</div><div>(( Input name ))</div>', 'item-id')

Apply a template to multiple items
	fin.applyTemplate('<div class="dueDate">(( user.task.dueDate ))</div><div class="messageSender">(( message.sender.name ))', 
		{ user: userItem, message: messageItem })

Get a specific view of an item property
	var view = fin.getView('Input', 'item-id', 'name')
	document.appendChild(view.getElement())

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

