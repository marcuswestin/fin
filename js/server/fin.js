// jsio
jsio.path.shared = '../../js'
jsio.path.server = '../../js'

// Let's do it
jsio('import net')
jsio('from shared.javascript import Singleton')
jsio('import server.ItemCouchDBStore')
jsio('import server.Server')
jsio('import server.ItemSetRedisStore')

// expose fin to global namespace
fin = Singleton(function() {
	
	this._server = null
	
	this.startServer = function(args) {
		var itemStore = args.itemStore
		var itemSetStore = args.itemSetStore
		
		itemStore.ensureExists()
		this._server = new server.Server(itemStore, itemSetStore)
		
		return this._server
	}
	
})
