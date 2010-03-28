
require('../../lib/js.io/packages/jsio')
require('./fin') // creates fin in global
var couchdb = require('../../lib/node-couchdb/lib/couchdb')
var redis = require('../../lib/redis-node-client/redisclient')

var couchClient = couchdb.createClient(5984, '127.0.0.1').db('fin')
var redisClient = new redis.Client()

jsio('import net')
jsio('import server.ItemCouchDBStore')
jsio('import server.ItemSetRedisStore')

redisClient.connect(function(){
	setTimeout(function(){ // why does the jsio import crash on process.cwd if I don't have this here?
		
		var finServer = fin.startServer({ 
			itemStore: new server.ItemCouchDBStore(couchClient),
			itemSetStore: new server.ItemSetRedisStore(redisClient)
		})
		
		net.listen(finServer, 'csp', { port: 5555 }) // for browser clients
		net.listen(finServer, 'tcp', { port: 5556, timeout: 0 }) // for robots
	})
})
