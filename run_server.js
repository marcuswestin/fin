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

var httpServer = http.createServer(function(req, res) {
	var requestPath = req.url.replace(/\.\./g, '') // don't want visitors to climb the path
	fs.readFile(__dirname + requestPath, function(err, text) {
		var extension = path.extname(requestPath)
		res.writeHead(err ? 404 : 200, {
			'Content-Type':contentTypes[extension]
		})
		res.end(text || '')
	})
})
httpServer.listen(8080);
finServer.start(httpServer, engine)

console.log('fin server running on :8080')
