var http = require('http'),
	path = require('path'),
	fs = require('fs'),
	finServer = require('./js/server/SocketServer'),
	engine = require('./engines/development')

var contentTypes = {
	'.js':   'application/javascript',
	'.css':  'text/css',
	'.html': 'text/html'
}

finServer.start(engine)

console.log('fin server running on :8080')
