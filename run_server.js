require('./lib/js.io/packages/jsio')

jsio.path.shared = './js'
jsio.path.server = './js'

jsio('import server.Server')

var redis = require('./lib/redis-node-client/lib/redis-client')
var finServer = new server.Server(redis)

// for browser clients
finServer.listen('csp', { port: 5555 }) 

// for robots
finServer.listen('tcp', { port: 5556, timeout: 0 }) 
