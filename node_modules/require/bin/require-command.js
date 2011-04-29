#!/usr/bin/env node

var path = require('path'),
	server = require('../server'),
	sys = require('sys'),
	compiler = require('../compiler')

var opts = {
	paths:   [],
	port:    1234,
	host:    'localhost',
	level:   null,
	command: 'server',
	file: null
}

var args = [].slice.call(process.argv, 2),
	commands = ['server', 'compile']

if (commands.indexOf(args[0]) != -1) {
	opts.command = args.shift()
	opts.file = args.shift()
}

while (args.length) {
	var arg = args.shift()
	switch(arg) {
		case '--port':
			opts.port = args.shift()
			break
		case '--host':
			opts.host = args.shift()
			break
		case '--level':
			opts.level = parseInt(args.shift())
			break
		case '--paths':
			while(args[0] && args[0].charAt(0) != '-') {
				opts.paths.push(path.resolve(process.cwd(), args.shift()))
			}
			break
		default:
			console.log('Unknown option', arg)
			process.exit(1)
			break
	}
}

switch (opts.command) {
	case 'server':
		for (var i=0; i<opts.paths.length; i++) { server.addPath(opts.paths[i]) }
		server.listen(opts.port, opts.host)
		console.log('dev server listening on', 'http://'+opts.host + ':' + opts.port, 'with paths:\n', opts.paths.concat(require.paths))
		break
	case 'compile':
		var example = 'require compile ./path/to/file.js --level 2'
		if (opts.level === null) {
			console.log('Specify a compilation level, e.g.')
			console.log(example)
			process.exit(1)
		}
		if (!opts.file) {
			console.log('Specify a single file to compile, e.g.')
			console.log(example)
			process.exit(1)
		}
		for (var i=0; i<opts.paths.length; i++) { compiler.addPath(opts.paths[i]) }
		compiler.compile(opts.file, opts.level, function(err, compiledCode) {
			if (err) {
				console.log('Compilation error', err)
				process.exit(1)
			}
			sys.print(compiledCode)
		})
		break
	default:
		console.log('Unknown command', opts.command)
		process.exit(1)
}

