// jsio
jsio.path.common = '../../js'
jsio.path.server = '../../js'

// Let's do it
jsio('import net')
jsio('from common.javascript import Singleton')
jsio('import server.ItemCouchDBStore')
jsio('import server.Server')
jsio('import server.ItemSetRedisStore')

// expose fin to global namespace
fin = Singleton(function() {
	
	this._server = null
	
	this.startServer = function(args) {
		var finDatabase = new server.ItemCouchDBStore(args.couchClient)
		finDatabase.ensureExists()
		
		var finItemStore = new server.ItemSetRedisStore(args.redisClient)

		this._server = new server.Server(finDatabase, finItemStore)
		return net.listen(this._server, (args.transport || 'csp'), { port: args.port || 5555 })
	}
	
	this.getItem = function(itemId, callback) {
		this._server.getItem(itemId, callback)
	}
	
})
