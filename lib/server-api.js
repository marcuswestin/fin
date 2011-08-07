var events = require('events'),
	http = require('http'),
	fs = require('fs'),
	io = require('socket.io'),
	data = require('./server/data'),
	requestHandlers = require('./server/requestHandlers'),
	curry = require('std/curry')

module.exports = {
	mount: mount,
	handleRequest: handleRequest,
	on: on
}

/* State
 *******/
var	_handlers = {},
	_emitter = new events.EventEmitter(),
	_engine

var clientJS = fs.readFileSync(__dirname + '/../build/client-api.js'),
	ormJS = fs.readFileSync(__dirname + '/../build/orm-api.js')
		
/* Exported API
 **************/
function mount(server, engine) {
	_engine = engine
	data.setEngine(engine)

	server.on('request', function(req, res) {
		if (req.url == '/fin/client.js') { res.end(clientJS) }
		else if (req.url == '/fin/orm.js') { res.end(ormJS) }
	})

	// https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO
	io.listen(server)
		.set('log level', 1)
		.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'])
		.set('browser client', false) // Does Socket.IO need to serve the static resources like socket.io.js and WebSocketMain.swf etc.
		.sockets.on('connection', _handleConnection)

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
	client.on('message', curry(_handleMessage, client))
	client.on('disconnect', curry(_handleDisconnect, client))
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
