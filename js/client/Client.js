jsio('import net')
jsio('import net.protocols.rtjp')
jsio('from shared.javascript import Class, bind, forEach')

exports = Class(net.protocols.rtjp.RTJPProtocol, function(supr) {
	
	this.init = function() {
		supr(this, 'init')
		this._isConnected = false
		this._eventHandlers = {}
		this._connectCallbacks = []
	}
	
/* Connection
 ************/
	this.connect = function(callback) {
		var callbacks = this._connectCallbacks
		
		if (!callbacks) { 
			callback()
		} else if (callbacks.length) { 
			callbacks.push(callback)
		} else {
			this._connectCallbacks = [callback]
			if (jsio.__env.name == 'node') {
				net.connect(this, 'tcp', {host:'127.0.0.1', port:5556, timeout:0})
			} else if (jsio.__env.name == 'browser') {
				var transport = location.hash.match(/fin-postmessage/) ? 'postmessage' : 'csp'
				net.connect(this, transport, {url:'http://' + (document.domain || '127.0.0.1') + ':5555'})
			}
		}
	}

	this.connectionMade = function() {
		logger.info("Connection made", arguments)
		// TODO Get the session key from the server
		this._sessionId = 'fin_random_session_' + Math.floor(Math.random() * 100000)
		this._isConnected = true
		var callback, callbacks = this._connectCallbacks || []
		delete this._connectCallbacks
		for (var i=0; callback = callbacks[i]; i++) { callback() }
	}

	this.connectionLost = function() {
		logger.info("Connection lost", arguments)
		this._isConnected = false
	}
	
	this.getSessionID = function() { return this._sessionId }

/* Events 
 ********/
	this.registerEventHandler = function(frameName, callback) {
		this._eventHandlers[frameName] = callback
	}

	this.frameReceived = function(id, name, args) {
		logger.debug('recv', id, name, JSON.stringify(args))
		if (!this._eventHandlers[name]) { 
			logger.warn('Received event without handler', name)
			return
		}
		var eventHandler = this._eventHandlers[name]
		setTimeout(function(){ eventHandler(args) }, 0)
	}
	
/* Util
 ******/ 
	// override for loggin
	this.sendFrame = function(name, args) {
		logger.debug('send', name, JSON.stringify(args))
		supr(this, 'sendFrame', arguments)
	}
})
