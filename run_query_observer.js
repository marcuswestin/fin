require('./lib/js.io/packages/jsio')

jsio.addPath('js', 'shared')
jsio.addPath('js', 'server')

var redis = require('./lib/redis-node-client/lib/redis-client')
var sys = require('sys')

jsio('from shared.javascript import bind')
jsio('import shared.query')

shared.query.init(redis)

process.addListener('exit', shared.query.release)
process.addListener('uncaughtException', function(e) {
	try {
		sys.puts("ERROR: uncaught exception", JSON.stringify(e))
	} catch(e2) {
		sys.puts("ERROR: could not JSON stringify error message", e.message, e2.message)
	}
	process.exit()
})
process.addListener('SIGINT', process.exit)