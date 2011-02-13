var storage = require('./redis-storage'),
	pubsub = require('./redis-pubsub')

module.exports = {
	getStore: storage.getStore,
	getPubSub: pubsub.getPubSub
	// getQuery: getQuery
}
