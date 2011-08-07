var redis = require('redis-client'),
	create = require('std/create')

module.exports = {
	getPubSub: getPubSub
}

function getPubSub() {
	var pubsub = create(pubsubAPI)
	pubsub.redisClient = redis.createClient()
	pubsub.redisClient.stream.setTimeout(0)
	return pubsub
}

var pubsubAPI = {
	subscribe: handleSubscribe,
	publish: handlePublish,
	unsubscribe: handleUnsubscribe,
	close: close
}

function handleSubscribe(channel, callback) {
	this.redisClient.subscribeTo(channel, callback)
}

function handlePublish(channel, value) {
	this.redisClient.publish(channel, value)
}

function handleUnsubscribe(channel, callback) {
	this.redisClient.unsubscribeFrom(channel, callback)
}

function close() {
	this.redisClient.close()
}
