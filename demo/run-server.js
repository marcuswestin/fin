var http = require('http'),
	path = require('path'),
	fs = require('fs'),
	fin = require('fin'),
	engine = require('../engines/development')

var contentTypes = {
	'.js':   'application/javascript',
	'.css':  'text/css',
	'.html': 'text/html'
}

fin.start(engine)
