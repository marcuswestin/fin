/* Query observer
	
	Listen to query requests
	When a query request comes in
		lock that query
		if got lock
			subscribe to all involved properties
			run query for all items currently in database (ugh...)
*/

require('./lib/js.io/packages/jsio')
jsio.path.shared = './js'
jsio.path.server = './js'

var redis = require('./lib/redis-node-client/lib/redis-client')
var sys = require('sys')

jsio('from shared.javascript import bind, createBlockedCallback, bytesToString')
jsio('import shared.keys')
jsio('import shared.query')

var subscribeClient = redis.createClient(),
	commandClient = redis.createClient(),
	blockedReadyCallback = createBlockedCallback(onClientsReady)

subscribeClient.stream.setTimeout(0)
commandClient.stream.setTimeout(0)
shared.query.setRedisClients(subscribeClient, commandClient)

subscribeClient.stream.addListener('connect', blockedReadyCallback.addBlock())
commandClient.stream.addListener('connect', blockedReadyCallback.addBlock())

function onClientsReady() {
	subscribeClient.subscribeTo(shared.keys.queryRequestChannel, function(channel, queryJSONBytes) {
		shared.query.monitorQuery(bytesToString(queryJSONBytes))
	})
}

process.addListener('exit', shared.query.releaseQueries)
process.addListener('uncaughtException', function(e) {
	sys.puts("ERROR: uncaught exception", JSON.stringify(e))
	process.exit()
})
process.addListener('SIGINT', process.exit)