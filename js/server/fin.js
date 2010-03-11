// jsio
jsio.path.common = '../../js'
jsio.path.server = '../../js'

// Let's do it
jsio('import net')
jsio('from common.javascript import Singleton')
jsio('import server.ItemCouchDBStore')
jsio('import server.Server')
jsio('import server.ItemSetRedisStore')

fin = Singleton(function() {
	
	this.startServer = function(args) {
		var finDatabase = new server.ItemCouchDBStore(args.couchClient)
		finDatabase.ensureExists()
		
		var finItemStore = new server.ItemSetRedisStore(args.redisClient)

		var finServer = new server.Server(finDatabase, finItemStore)
		return net.listen(finServer, (args.transport || 'csp'), { port: args.port || 5555 })
	}
	
})
