var http = require('http'),
	fs = require('fs'),
	dependency = require('./shared/dependency'),
	requireServer = require('require/server')

requireServer.listen(1234)
requireServer.addPath('.')

console.log('starting simple file server on localhost:8080')
var base = __dirname + '/'
http.createServer(function(req, res) {
	fs.readFile(base + (req.url.substr(1) || 'index.html'), function(err, content) {
		if (err) { return res.end(err.stack) }
		res.end(content)
	})
}).listen(8080)

console.log('shared dependency:', dependency)
