jsio('import net')
jsio('import net.protocols.rtjp')
jsio('from shared.javascript import Class, bind, forEach')

exports = Class(net.protocols.rtjp.RTJPProtocol, function(supr) {
	
	this.init = function() {
		supr(this, 'init')
		this._isConnected = false
		this._eventHandlers = {}
	}
	
/* Connection
 ************/
	this.connect = function(transport, connectParams, onConnectedCallback) {
		net.connect(this, transport, connectParams)
		if (this._isConnected) { 
			onConnectedCallback()
		} else if (this._onConnectedCallbacks) { 
			this._onConnectedCallbacks.push(onConnectedCallback)
		} else {
			this._onConnectedCallbacks = [onConnectedCallback]
		}
	}

	this.connectionMade = function() {
		this._isConnected = true
		for (var i=0, cb; cb = this._onConnectedCallbacks[i]; i++) { cb() }
		delete this._onConnectedCallbacks
	}

	this.connectionLost = function() {
		logger.info("Connection lost", arguments)
		this._isConnected = false
	}

/* Events 
 ********/
	this.registerEventHandler = function(frameName, callback) {
		this._eventHandlers[frameName] = callback
	}

	this.frameReceived = function(id, name, args) {
		logger.log('recv', id, name, JSON.stringify(args))
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
		logger.log('send', name, JSON.stringify(args))
		supr(this, 'sendFrame', arguments)
	}
})
