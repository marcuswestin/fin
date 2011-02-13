var events = require('events'),
	io = require('../lib/socket.io'),
	storage = require('./fin/storage'),
	requests = require('./fin/requests'),
	log = require('./fin/logger').log,
	util = require('./fin/util')

var emitter = new events.EventEmitter()

module.exports = {
	start: start,
	handleRequest: handleRequest,
	on: util.bind(emitter, 'on')
}

/* State
 *******/
var	engine = null,
	store = null,
	requestHandlers = {}

/* Exported API
 **************/
function start(withEngine, httpServer) {
	engine = withEngine
	
	storage.setStore(engine.getStore())
	
	if (!httpServer) {
		httpServer = require('http').createServer(function(){})
		httpServer.listen(8080, '127.0.0.1')
	}
	var socket = io.listen(httpServer)
	socket.on('connection', _handleConnection)
	
	handleRequest
		('observe', requests.observeHandler)
		('unsubscribe', requests.unsubscribeHandler)
		('create', requests.createHandler)
		('mutate', requests.mutateHandler)
		('extend_list', requests.extendListHandler)
}

function handleRequest(messageType, handler) {
	requestHandlers[messageType] = handler
	return handleRequest
}

/* Handler functions
 *******************/
function _handleConnection(client) {
	log('new connection', client.sessionId)
	client.subscriptionStore = engine.getStore()
	client.on('message', util.curry(_handleMessage, client))
	client.on('disconnect', util.curry(_handleDisconnect, client))
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
