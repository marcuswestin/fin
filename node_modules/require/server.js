var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./lib/util')

var server = module.exports = {
	listen: listen,
	addPath: addPath,
	setRoot: setRoot
}

var modules = {},
	closureStart = '(function() {',
	moduleDef = 'var module = {exports:{}}; var exports = module.exports;',
	closureEnd = '})()',
	root = '/'

function setRoot(_root) {
	root = _root
	return server
}

function addPath(path) {
	util.addPath(path)
	return server
}

function listen(port, host) {
	port = port || 1234
	host = typeof host == 'undefined' ? 'localhost' : host
	var server = http.createServer(function(req, res) {
		var reqPath = req.url.substr(root.length)
		if (reqPath.match(/\.js$/)) {
			fs.readFile(reqPath, function(err, content) {
				if (err) { return res.end('alert("' + err + '")') }
				var code = content.toString()
				res.write(closureStart + moduleDef)
				var requireStatements = util.getRequireStatements(code)
				for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
					var depPath = util.resolveRequireStatement(requireStmnt, reqPath)
					code = code.replace(requireStmnt, 'require["'+depPath+'"]')
				}
				res.write(code)
				res.write('\nrequire["'+reqPath+'"]=module.exports')
				res.end(closureEnd)
			})
		} else {
			// main module
			try {
				var modulePath = util.resolve(reqPath),
					deps = util.getDependencyList(modulePath),
					base = '//' + host + ':' + port + root
	
				res.write('var require = {}\n')
				for (var i=0; i<deps.length; i++) {
					var depPath = base + deps[i]
					res.write('document.write(\'<script src="'+depPath+'"></script>\')\n')
				}
			} catch(e) {
				res.write('alert("error in ' + (modulePath || reqPath) + ': ' + e + '")')
			}
			res.end()
		}
	})
	server.listen(port, host)
	return server
}

