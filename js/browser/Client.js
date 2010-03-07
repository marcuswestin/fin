jsio('import net')
jsio('import net.protocols.rtjp');
jsio('from common.javascript import Class, bind, forEach');
jsio('import common.itemFactory');

exports = Class(net.protocols.rtjp.RTJPProtocol, function(supr) {

	// Hack to detect if we should use postmessage. See js/server/index.html
	this.transport = location.hash.match(/fin-postmessage/) ? 'postmessage' : 'csp';
	this.url = "http://" + (document.domain || "127.0.0.1") + ":5555";

	this.init = function(playerFactory) {
		supr(this, 'init');

		this._isConnected = false;
		this._eventHandlers = {};
	}
	
/* Connection
 ************/
	this.connect = function(onConnectedCallback) {
		net.connect(this, this.transport, { url: this.url });
		if (this._isConnected) { 
			onConnectedCallback();
		} else if (this._onConnectedCallbacks) { 
			this._onConnectedCallbacks.push(onConnectedCallback);
		} else {
			this._onConnectedCallbacks = [onConnectedCallback];
		}
	}

	this.connectionMade = function() {
		this._isConnected = true
		for (var i=0, cb; cb = this._onConnectedCallbacks[i]; i++) { cb() }
		delete this._onConnectedCallbacks;
	}

	this.connectionLost = function() {
		this._isConnected = false
	}

/* Events 
 ********/
	this.registerEventHandler = function(frameName, callback) {
		this._eventHandlers[frameName] = callback
	}

	this.frameReceived = function(id, name, args) {
		logger.log('frameReceived', id, name, JSON.stringify(args))
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
		this._log('sendFrame', name, JSON.stringify(args));
		supr(this, 'sendFrame', arguments);
	}

	this._log = function() {
		var args = Array.prototype.slice.call(arguments);
		if (this.transport._conn) {
			args.unshift(this.transport._conn._sessionKey);
		}
		logger.log.apply(this, args);
	}
});
