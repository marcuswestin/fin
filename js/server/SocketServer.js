var io = require('../../lib/socket.io'),
	storage = require('./storage'),
	requests = require('./requests'),
	log = require('./logger').log,
	curry = require('../shared/util').curry

module.exports = {
	start: start
}

/* State
 *******/
var started = false,
	engine = null,
	store = null,
	debug = true

/* Exported API
 **************/
function start(httpServer, withEngine) {
	if (started) { throw new Error("Tried to start server twice") }
	engine = withEngine
	storage.setStore(engine.getStore())
	
	var socket = io.listen(httpServer)
	socket.on('connection', _handleConnection)
}

/* Handler functions
 *******************/
function _handleConnection(client) {
	log('new connection', client.sessionId)
	client.subscriptionStore = engine.getStore()
	client.on('message', curry(_handleMessage, client))
	client.on('disconnect', curry(_handleDisconnect, client))
}

function _handleMessage(client, message) {
	requests.handleRequest(client, message)
}

function _handleDisconnect(client) {
	log('TODO implement _handleDisconnect', arguments)
}

