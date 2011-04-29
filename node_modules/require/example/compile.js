var sys = require('sys'),
	fs = require('fs'),
	compiler = require('../compiler')

var file = __dirname + '/client.js',
	basePath = __dirname,
	code = fs.readFileSync(file).toString()

compileAndPrint(0, function() {
	compileAndPrint(1, function() {
		compileAndPrint(2, function() {
			compileAndPrint(3, function() {
				console.log("Done!")
			})
		})
	})
})

function compileAndPrint(level, callback) {
	console.log('Compile code at level', level)
	compiler.compile(code, level, basePath, function(err, compiledCode) {
		if (err) { throw err }
		console.log(compiledCode)
		callback()
	})
}
