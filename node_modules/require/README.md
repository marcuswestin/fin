require brings `require` to the browser
=======================================

Node implements a simple module management system with the `require` statement and the `npm` command
line module manager. This library brings those functionalities to the browser, as well as advanced
compilation functionality for production deployment.

Installation
============
From npm repo

	sudo npm install require

or from source

	git clone git://github.com/marcuswestin/require.git
	sudo npm install ./require

Usage
=====
In your HTML, import a javascript module and all its dependencies with a simple script include.
In this case we'll import the example/client module.

	<script src="//localhost:1234/example/client"></script>

Start the dev server. You can also pass in the directories in which your javascript modules live.
Those directories will be added to the javascript module search path.

	require --port 1234 --host localhost
	# or
	require --port 1234 --host localhost --paths ./path/to/my/js/ ./path/to/node_modules/

(make sure that the npm bin is in your path)

	echo "PATH=`npm bin`:$PATH" >> ~/.bash_profile && source ~/.bash_profile

Use programmatically
====================
You can also start the require server programmatically alongside another node server.

	var devServer = require('require/server')
	devServer.addPath(__dirname + '/modules')
	devServer.listen(1234, 'localhost')

Compilation
===========
For production you want to bundle all your dependencies into a single file and compress them.

	require compile ./example/client.js --level 2

Add to the search path by passing in paths.

	require compile ./example/client.js --level 2 --paths path/to/node_modules

There are 4 different compilation levels - they correspond to google closure's compilation levels.
Levels 2 and 3 are pretty aggressive and may break certain programming patterns, such as dynamic
dispatch  (`var eventName = 'click', document.body['on' + eventName = function() { ... }`)

	Compilation levels:
	0 - none
	1 - whitespace
	2 - simple optimizations
	3 - advanced optimizations

You can also use the compiler programmatically. Pass it a file path, or a snippet of code.

	var compiler = require('require/compiler')

	compiler.compile('./example/client.js', 2, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
	})

	var basePath = __dirname
	compiler.compileCode('console.log(require("./example/client"))', 1, basePath, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
	})

npm packages
============
require can import npm packages in the browser. Try installing e.g. raphael, the SVG library.

	sudo npm install raphael

And then require it client-side

	var raphael = require('raphael'),
		canvas = document.body.appendChild(document.createElement('div')),
		paper = raphael(canvas)
	
	paper.circle(50, 50, 40)

You can see the result if you have the source checked out:

	git clone git://github.com/marcuswestin/require.git
	cd require/example/
	node server.js
	# Open browser to http://localhost:8080/raphael_circle.html

Examples
========
For working examples, give this a try:

	node require/examples/server.js
	# open browser to localhost:8080
	
	node require/examples/compile.js
