var fs = require('fs'),
	compiler = require('require/compiler')

var arg = function(arg) {
	return process.argv.indexOf(arg) != -1
}

var compile = []
if (arg('client')) { compile.push('client') }
if (arg('models')) { compile.push('models') }

var paths = {
	client: './api/client.js',
	models: './api/models/index.js'
}

var out = {
	client: 'fin-client',
	models: 'fin-models-client'
}

for (var i=0, target; target = compile[i]; i++) (function(target) {
	console.log('compiling', target, paths[target], '...')
	var compiledJS = compiler.compileJSFile(paths[target])
	console.log('done compiling', target)
	fs.writeFileSync(out[target] + '.js', compiledJS)
	if (arg('--compress')) {
		console.log('compressing', target, '...')
		compiler.compressJS(compiledJS, function(compressedJS) {
			fs.writeFileSync(out[target] + '.min.js', compressedJS)
			console.log('done compressing', target)
		})
	}
})(target)


