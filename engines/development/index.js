var storeAPI = require('./storage'),
	pubsubAPI = require('./pubsub'),
	create = require('std/create')

module.exports = {
	getStore: function() { return create(storeAPI) },
	getPubSub: function() { return create(pubsubAPI).initialize() }
}

process.on('SIGINT', function() {
	console.log('\nnode engine caught SIGINT - shutting down cleanly')
	process.exit()
})

