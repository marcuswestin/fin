var http = require('http'),
	path = require('path'),
	fs = require('fs'),
	fin = require('../api/server'),
	engine = require('../engines/development')

var contentTypes = {
	'.js':   'application/javascript',
	'.css':  'text/css',
	'.html': 'text/html'
}

fin.start(engine)

console.log('fin server running on :8080')
