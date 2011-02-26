var events = require('events'),
	io = require('../lib/socket.io'),
	data = require('./fin/data'),
	requests = require('./fin/requests'),
	log = require('./fin/logger').log,
	util = require('./fin/util')

module.exports = {
	start: start,
	handleRequest: handleRequest,
	on: on
}

/* State
 *******/
var	requestHandlers = {},
	emitter = new events.EventEmitter(),
	engine

/* Exported API
 **************/
function start(theEngine, httpServer) {
	engine = theEngine
	data.setEngine(engine)
	
	if (!httpServer) {
		httpServer = require('http').createServer(function(){})
		httpServer.listen(8080, '127.0.0.1')
	}
	var socket = io.listen(httpServer)
	socket.on('connection', _handleConnection)
	
	module.exports
		.handleRequest('observe', requests.observeHandler)
		.handleRequest('unsubscribe', requests.unsubscribeHandler)
		.handleRequest('create', requests.createHandler)
		.handleRequest('mutate', requests.mutateHandler)
		.handleRequest('extend_list', requests.extendListHandler)
		.handleRequest('transact', requests.transactionHandler)
}

function handleRequest(messageType, handler) {
	requestHandlers[messageType] = handler
	return module.exports
}

function on(event, handler) {
	emitter.on(event, handler)
	return module.exports
}

/* Handler functions
 *******************/
function _handleConnection(client) {
	log('new connection', client.sessionId)
	client.on('message', util.curry(_handleMessage, client))
	client.on('disconnect', util.curry(_handleDisconnect, client))
	client.pubsub = engine.getPubSub()
	emitter.emit('client_connect', client)
}

function _handleMessage(client, message) {
	if (!requestHandlers[message.request]) {
		log('unknown request type', message.request)
		return
	}
	requestHandlers[message.request](client, message)
}

function _handleDisconnect(client) {
	emitter.emit('client_disconnect', client)
}
