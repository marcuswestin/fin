var events = require('events'),
	io = require('../lib/socket.io'),
	data = require('./fin/data'),
	requestHandlers = require('./fin/requestHandlers'),
	util = require('./fin/util')

module.exports = {
	start: start,
	handleRequest: handleRequest,
	on: on
}

/* State
 *******/
var	_handlers = {},
	_emitter = new events.EventEmitter(),
	_engine

/* Exported API
 **************/
function start(theEngine, httpServer) {
	_engine = theEngine
	data.setEngine(_engine)
	
	if (!httpServer) {
		httpServer = require('http').createServer(function(){})
		httpServer.listen(8080, '127.0.0.1')
	}
	var socket = io.listen(httpServer)
	socket.on('connection', _handleConnection)
	
	module.exports
		.handleRequest('observe', requestHandlers.observeHandler)
		.handleRequest('unsubscribe', requestHandlers.unsubscribeHandler)
		.handleRequest('create', requestHandlers.createHandler)
		.handleRequest('mutate', requestHandlers.mutateHandler)
		.handleRequest('extend_list', requestHandlers.extendListHandler)
		.handleRequest('transact', requestHandlers.transactionHandler)
}

function handleRequest(messageType, handler) {
	_handlers[messageType] = handler
	return module.exports
}

function on(event, handler) {
	_emitter.on(event, handler)
	return module.exports
}

/* Handler functions
 *******************/
function _handleConnection(client) {
	console.log('new connection', client.sessionId)
	client.on('message', util.curry(_handleMessage, client))
	client.on('disconnect', util.curry(_handleDisconnect, client))
	client.pubsub = _engine.getPubSub()
	_emitter.emit('client_connect', client)
}

function _handleMessage(client, message) {
	if (!_handlers[message.request]) {
		console.log('unknown request type', message.request)
		return
	}
	_handlers[message.request](client, message)
}

function _handleDisconnect(client) {
	_emitter.emit('client_disconnect', client)
}
