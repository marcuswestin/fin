var require = {}
var util = require._=(function() {
	var module = require["api/fin/util"] = {exports:{}}, exports = module.exports
	// start module code
	module.exports = {
		bind: bind,
		curry: curry,
		blockCallback: blockCallback,
		each: each,
		map: map,
		pick: pick,
		copyArray: copyArray,
		defineGetter: defineGetter
	}
	
	function curry(fn /* arg1, arg2, ... */) {
		var curryArgs = Array.prototype.slice.call(arguments, 1)
		return function() {
			var args = curryArgs.concat(Array.prototype.slice.call(arguments, 0))
			fn.apply(this, args)
		}
	}
	
	function bind(context, method/*, args... */) {
		if (!context || !method || (typeof method == 'string' && !context[method])) { throw "bad bind arguments" }
		var curryArgs = Array.prototype.slice.call(arguments, 2)
		return function() {
			fn = (typeof method == 'string' ? context[method] : method)
			return fn.apply(context, curryArgs.concat(Array.prototype.slice.call(arguments, 0)))
		}
	}
	
	function each(items, ctx, fn) {
		if (!items) { return }
		if (!fn) { fn = ctx, ctx = this }
		if (isArray(items)) {
			for (var i=0; i < items.length; i++) { fn.call(ctx, items[i], i) }
		} else {
			for (var key in items) { fn.call(ctx, items[key], key) }
		}
	}
	
	function map(items, fn) {
		var results = []
		each(items, function(item, key) { results.push(fn(item, key)) })
		return results
	}
	
	function pick(arr, fn) {
		var result = []
		for (var i=0, value; i < arr.length; i++) {
			value = fn(arr[i])
			if (value) { result.push(value) }
		}
		return result
	}
	
	// var stripRegexp = /^\s*(.*?)\s*$/
	// exports.strip = function(str) {
	// return str.match(stripRegexp)[1]
	// }
	// 
	// exports.capitalize = function(str) {
	// if (!str) { return '' }
	// return str[0].toUpperCase() + str.substring(1)
	// }
	// 
	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]'
	}
	
	function blockCallback(callback, opts) {
		opts = opts || {}
		opts.fireOnce = (typeof opts.fireOnce != 'undefined' ? opts.fireOnce : true)
		var blocks = 0,
		fired = false,
		result = {
			addBlock: function() { 
				blocks++ 
				var blockReleased = false
				return function(err) {
					if (err && opts.throwErr) {
						throw new Error(err)
					}
					if (blockReleased) {
						result.tryNow()
						return
					}
					blockReleased = true
					blocks--
					setTimeout(result.tryNow)
				}
			},
			tryNow: function() {
				if (fired && opts.fireOnce) { return }
				if (blocks == 0) {
					fired = true
					callback()
				}
			}
		}
		return result
	}
	
	function copyArray(array) {
		return Array.prototype.slice.call(array, 0)
	}
	
	function defineGetter(object, propertyName, getter) {
		var fn = object.defineGetter ? _w3cDefineGetter
		: object.__defineGetter__ ? _interimDefineGetter
		: Object.defineProperty ? _ie8DefineGetter
		: function() { throw 'defineGetter not supported' }
		
		module.exports.defineGetter = fn
		fn.apply(this, arguments)
	}
	
	var _w3cDefineGetter = function(object, propertyName, getter) {
		object.defineGetter(propertyName, getter)
	}
	
	var _interimDefineGetter = function(object, propertyName, getter) {
		object.__defineGetter__(propertyName, getter)
	}
	
	var _ie8DefineGetter = function(object, propertyName, getter) {
		Object.defineProperty(object, propertyName, { value:getter, enumerable:true, configurable:true })
	}
	
	
	// 
	// exports.getDependable = function() {
	// var dependants = [],
	// dependable = {}
	// 
	// dependable.depend = function(onFulfilled) {
	// dependants.push(onFulfilled)
	// if (dependable.fulfillment) {
	// onFulfilled.apply(this, dependable.fulfillment)
	// }
	// }
	// dependable.fulfill = function() {
	// dependable.fulfillment = arguments
	// for (var i=0; i < dependants.length; i++) {
	// dependants[i].apply(this, dependable.fulfillment)
	// }
	// }
	// return dependable
	// }
	// 
	// exports.assert = function(shouldBeTrue, msg, values) {
	// if (shouldBeTrue) { return }
	// var moreInfo = values ? (' : ' + JSON.stringify(values)) : ''
	// throw new Error(msg + moreInfo)
	// }
	
	// end module code
	return module.exports
})(),
Pool = require._=(function() {
	var module = require["api/fin/Pool"] = {exports:{}}, exports = module.exports
	// start module code
	var Class = require["api/fin/util"].exports.Class
	
	module.exports = function() {
		this._pool = {}
		this._counts = {}
		this._uniqueId = 0
	}
	
	module.exports.prototype = {
		add: function(name, item) {
			if (!this._pool[name]) { 
				this._pool[name] = {}
				this._counts[name] = 0
			}
			this._counts[name]++
			var id = 'p' + this._uniqueId++
			this._pool[name][id] = item
			return id
		},
		
		remove: function(name, id) {
			var item = this._pool[name][id]
			delete this._pool[name][id]
			if (this._counts[name]-- == 0) {
				delete this._counts[name]
				delete this._pool[name]
			}
			return item
		},
		
		get: function(name) {
			return this._pool[name]
		},
		
		count: function(name) {
			return this._counts[name] || 0
		}
	}
	
	// end module code
	return module.exports
})(),
keys = require._=(function() {
	var module = require["api/fin/keys"] = {exports:{}}, exports = module.exports
	// start module code
	/************************************
	 * Redis key and channel namespaces *
	 ************************************/
	
	module.exports = {
		getItemPropertyKey: getItemPropertyKey,
		getKeyInfo: getKeyInfo,
		getPropertyChannel: getPropertyChannel,
		getFocusProperty: getFocusProperty,
		// The unique ID key is used to consistently increase item id's. Should we use guid's instead?
		uniqueIdKey: '__fin_unique_id'
	}
	
	// item properties are stored at I<item id>@<propName>e.g. I20@books
	// channel names for items are#I<item id>e.g. #I20
	// channel names for properties are#P<propName>e.g. #Pbooks
	
	// Data state keys
	function getItemPropertyKey(itemID, propName) {
		if (itemID === undefined || propName === undefined) {
			throw new Error("itemID and propName are required for keys.getItemPropertyKey")
		}
		return 'I' + itemID + '@' + propName
	}
	
	function getKeyInfo(key) {
		var type = key[0],
		parts = key.substr(1).split('@')
		
		return { type: type, id: parseInt(parts[0]), property: parts[1] }
	}
	
	function getPropertyChannel(propName) {
		return '#P' + propName
	}
	
	// Misc
	function getFocusProperty(propName) {
		return '_focus_' + propName
	}
	// end module code
	return module.exports
})()

// socket.io expects the request for the js file to come in at root
//  level, and puts the io object in the global scope
require._=(function() {
	var module = require["lib/socket.io/support/socket.io-client/socket.io"] = {exports:{}}, exports = module.exports
	// start module code
	/** Socket.IO 0.6.2 - Built with build.js */
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	this.io = {
		version: '0.6.2',
		
		setPath: function(path){
			if (window.console && console.error) console.error('io.setPath will be removed. Please set the variable WEB_SOCKET_SWF_LOCATION pointing to WebSocketMain.swf');
			this.path = /\/$/.test(path) ? path : path + '/';
			    WEB_SOCKET_SWF_LOCATION = path + 'lib/vendor/web-socket-js/WebSocketMain.swf';
		}
	};
	
	if ('jQuery' in this) jQuery.io = this.io;
	
	if (typeof window != 'undefined'){
		  // WEB_SOCKET_SWF_LOCATION = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//cdn.socket.io/' + this.io.version + '/WebSocketMain.swf';
		  if (typeof WEB_SOCKET_SWF_LOCATION === 'undefined')
		    WEB_SOCKET_SWF_LOCATION = '/socket.io/lib/vendor/web-socket-js/WebSocketMain.swf';
	}
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var _pageLoaded = false;
		
		io.util = {
			
			ios: false,
			
			load: function(fn){
				if (/loaded|complete/.test(document.readyState) || _pageLoaded) return fn();
				if ('attachEvent' in window){
					window.attachEvent('onload', fn);
				} else {
					window.addEventListener('load', fn, false);
				}
			},
			
			inherit: function(ctor, superCtor){
				// no support for `instanceof` for now
				for (var i in superCtor.prototype){
					ctor.prototype[i] = superCtor.prototype[i];
				}
			},
			
			indexOf: function(arr, item, from){
				for (var l = arr.length, i = (from < 0) ? Math.max(0, l + from) : from || 0; i < l; i++){
					if (arr[i] === item) return i;
				}
				return -1;
			},
			
			isArray: function(obj){
				return Object.prototype.toString.call(obj) === '[object Array]';
			},
			
			    merge: function(target, additional){
				      for (var i in additional)
				        if (additional.hasOwnProperty(i))
				          target[i] = additional[i];
			    }
			
		};
		
		io.util.ios = /iphone|ipad/i.test(navigator.userAgent);
		io.util.android = /android/i.test(navigator.userAgent);
		io.util.opera = /opera/i.test(navigator.userAgent);
		
		io.util.load(function(){
			_pageLoaded = true;
		});
		
	})();
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	// abstract
	
	(function(){
		
		var frame = '~m~',
		
		stringify = function(message){
			if (Object.prototype.toString.call(message) == '[object Object]'){
				if (!('JSON' in window)){
					if ('console' in window && console.error) console.error('Trying to encode as JSON, but JSON.stringify is missing.');
					return '{ "$error": "Invalid message" }';
				}
				return '~j~' + JSON.stringify(message);
			} else {
				return String(message);
			}
		};
		
		Transport = io.Transport = function(base, options){
			this.base = base;
			this.options = {
				timeout: 15000 // based on heartbeat interval default
			};
			io.util.merge(this.options, options);
		};
		
		Transport.prototype.send = function(){
			throw new Error('Missing send() implementation');
		};
		
		Transport.prototype.connect = function(){
			throw new Error('Missing connect() implementation');
		};
		
		Transport.prototype.disconnect = function(){
			throw new Error('Missing disconnect() implementation');
		};
		
		Transport.prototype._encode = function(messages){
			var ret = '', message,
			messages = io.util.isArray(messages) ? messages : [messages];
			for (var i = 0, l = messages.length; i < l; i++){
				message = messages[i] === null || messages[i] === undefined ? '' : stringify(messages[i]);
				ret += frame + message.length + frame + message;
			}
			return ret;
		};
		
		Transport.prototype._decode = function(data){
			var messages = [], number, n;
			do {
				if (data.substr(0, 3) !== frame) return messages;
				data = data.substr(3);
				number = '', n = '';
				for (var i = 0, l = data.length; i < l; i++){
					n = Number(data.substr(i, 1));
					if (data.substr(i, 1) == n){
						number += n;
					} else {
						data = data.substr(number.length + frame.length);
						number = Number(number);
						break;
					} 
				}
				messages.push(data.substr(0, number)); // here
				data = data.substr(number);
			} while(data !== '');
			return messages;
		};
		
		Transport.prototype._onData = function(data){
			this._setTimeout();
			var msgs = this._decode(data);
			if (msgs && msgs.length){
				for (var i = 0, l = msgs.length; i < l; i++){
					this._onMessage(msgs[i]);
				}
			}
		};
		
		Transport.prototype._setTimeout = function(){
			var self = this;
			if (this._timeout) clearTimeout(this._timeout);
			this._timeout = setTimeout(function(){
				self._onTimeout();
			}, this.options.timeout);
		};
		
		Transport.prototype._onTimeout = function(){
			this._onDisconnect();
		};
		
		Transport.prototype._onMessage = function(message){
			if (!this.sessionid){
				this.sessionid = message;
				this._onConnect();
			} else if (message.substr(0, 3) == '~h~'){
				this._onHeartbeat(message.substr(3));
			} else if (message.substr(0, 3) == '~j~'){
				this.base._onMessage(JSON.parse(message.substr(3)));
			} else {
				this.base._onMessage(message);
			}
		},
		
		Transport.prototype._onHeartbeat = function(heartbeat){
			this.send('~h~' + heartbeat); // echo
		};
		
		Transport.prototype._onConnect = function(){
			this.connected = true;
			this.connecting = false;
			this.base._onConnect();
			this._setTimeout();
		};
		
		Transport.prototype._onDisconnect = function(){
			this.connecting = false;
			this.connected = false;
			this.sessionid = null;
			this.base._onDisconnect();
		};
		
		Transport.prototype._prepareUrl = function(){
			return (this.base.options.secure ? 'https' : 'http') 
			+ '://' + this.base.host 
			+ ':' + this.base.options.port
			+ '/' + this.base.options.resource
			+ '/' + this.type
			+ (this.sessionid ? ('/' + this.sessionid) : '/');
		};
		
	})();
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var empty = new Function,
		    
		XMLHttpRequestCORS = (function(){
			if (!('XMLHttpRequest' in window)) return false;
			// CORS feature detection
			var a = new XMLHttpRequest();
			return a.withCredentials != undefined;
		})(),
		
		request = function(xdomain){
			if ('XDomainRequest' in window && xdomain) return new XDomainRequest();
			if ('XMLHttpRequest' in window && (!xdomain || XMLHttpRequestCORS)) return new XMLHttpRequest();
			if (!xdomain){
				try {
					var a = new ActiveXObject('MSXML2.XMLHTTP');
					return a;
				} catch(e){}
				
				try {
					var b = new ActiveXObject('Microsoft.XMLHTTP');
					return b;
				} catch(e){}
			}
			return false;
		},
		
		XHR = io.Transport.XHR = function(){
			io.Transport.apply(this, arguments);
			this._sendBuffer = [];
		};
		
		io.util.inherit(XHR, io.Transport);
		
		XHR.prototype.connect = function(){
			this._get();
			return this;
		};
		
		XHR.prototype._checkSend = function(){
			if (!this._posting && this._sendBuffer.length){
				var encoded = this._encode(this._sendBuffer);
				this._sendBuffer = [];
				this._send(encoded);
			}
		};
		
		XHR.prototype.send = function(data){
			if (io.util.isArray(data)){
				this._sendBuffer.push.apply(this._sendBuffer, data);
			} else {
				this._sendBuffer.push(data);
			}
			this._checkSend();
			return this;
		};
		
		XHR.prototype._send = function(data){
			var self = this;
			this._posting = true;
			this._sendXhr = this._request('send', 'POST');
			this._sendXhr.onreadystatechange = function(){
				var status;
				if (self._sendXhr.readyState == 4){
					self._sendXhr.onreadystatechange = empty;
					try { status = self._sendXhr.status; } catch(e){}
					self._posting = false;
					if (status == 200){
						self._checkSend();
					} else {
						self._onDisconnect();
					}
				}
			};
			this._sendXhr.send('data=' + encodeURIComponent(data));
		};
		
		XHR.prototype.disconnect = function(){
			// send disconnection signal
			this._onDisconnect();
			return this;
		};
		
		XHR.prototype._onDisconnect = function(){
			if (this._xhr){
				this._xhr.onreadystatechange = empty;
				      try {
					        this._xhr.abort();
				      } catch(e){}
				this._xhr = null;
			}
			if (this._sendXhr){
				      this._sendXhr.onreadystatechange = empty;
				      try {
					        this._sendXhr.abort();
				      } catch(e){}
				this._sendXhr = null;
			}
			this._sendBuffer = [];
			io.Transport.prototype._onDisconnect.call(this);
		};
		
		XHR.prototype._request = function(url, method, multipart){
			var req = request(this.base._isXDomain());
			if (multipart) req.multipart = true;
			req.open(method || 'GET', this._prepareUrl() + (url ? '/' + url : ''));
			if (method == 'POST' && 'setRequestHeader' in req){
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=utf-8');
			}
			return req;
		};
		
		XHR.check = function(xdomain){
			try {
				if (request(xdomain)) return true;
			} catch(e){}
			return false;
		};
		
		XHR.xdomainCheck = function(){
			return XHR.check(true);
		};
		
		XHR.request = request;
		
	})();
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var WS = io.Transport.websocket = function(){
			io.Transport.apply(this, arguments);
		};
		
		io.util.inherit(WS, io.Transport);
		
		WS.prototype.type = 'websocket';
		
		WS.prototype.connect = function(){
			var self = this;
			this.socket = new WebSocket(this._prepareUrl());
			this.socket.onmessage = function(ev){ self._onData(ev.data); };
			this.socket.onclose = function(ev){ self._onClose(); };
			    this.socket.onerror = function(e){ self._onError(e); };
			return this;
		};
		
		WS.prototype.send = function(data){
			if (this.socket) this.socket.send(this._encode(data));
			return this;
		};
		
		WS.prototype.disconnect = function(){
			if (this.socket) this.socket.close();
			return this;
		};
		
		WS.prototype._onClose = function(){
			this._onDisconnect();
			return this;
		};
		
		  WS.prototype._onError = function(e){
			    this.base.emit('error', [e]);
		  };
		
		WS.prototype._prepareUrl = function(){
			return (this.base.options.secure ? 'wss' : 'ws') 
			+ '://' + this.base.host 
			+ ':' + this.base.options.port
			+ '/' + this.base.options.resource
			+ '/' + this.type
			+ (this.sessionid ? ('/' + this.sessionid) : '');
		};
		
		WS.check = function(){
			// we make sure WebSocket is not confounded with a previously loaded flash WebSocket
			return 'WebSocket' in window && WebSocket.prototype && ( WebSocket.prototype.send && !!WebSocket.prototype.send.toString().match(/native/i)) && typeof WebSocket !== "undefined";
		};
		
		WS.xdomainCheck = function(){
			return true;
		};
		
	})();
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var Flashsocket = io.Transport.flashsocket = function(){
			io.Transport.websocket.apply(this, arguments);
		};
		
		io.util.inherit(Flashsocket, io.Transport.websocket);
		
		Flashsocket.prototype.type = 'flashsocket';
		
		Flashsocket.prototype.connect = function(){
			var self = this, args = arguments;
			WebSocket.__addTask(function(){
				io.Transport.websocket.prototype.connect.apply(self, args);
			});
			return this;
		};
		
		Flashsocket.prototype.send = function(){
			var self = this, args = arguments;
			WebSocket.__addTask(function(){
				io.Transport.websocket.prototype.send.apply(self, args);
			});
			return this;
		};
		
		Flashsocket.check = function(){
			if (typeof WebSocket == 'undefined' || !('__addTask' in WebSocket)) return false;
			if (io.util.opera) return false; // opera is buggy with this transport
			if ('navigator' in window && 'plugins' in navigator && navigator.plugins['Shockwave Flash']){
				return !!navigator.plugins['Shockwave Flash'].description;
			  }
			if ('ActiveXObject' in window) {
				try {
					return !!new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
				} catch (e) {}
			}
			return false;
		};
		
		Flashsocket.xdomainCheck = function(){
			return true;
		};
		
	})();
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var HTMLFile = io.Transport.htmlfile = function(){
			io.Transport.XHR.apply(this, arguments);
		};
		
		io.util.inherit(HTMLFile, io.Transport.XHR);
		
		HTMLFile.prototype.type = 'htmlfile';
		
		HTMLFile.prototype._get = function(){
			var self = this;
			this._open();
			window.attachEvent('onunload', function(){ self._destroy(); });
		};
		
		HTMLFile.prototype._open = function(){
			this._doc = new ActiveXObject('htmlfile');
			this._doc.open();
			this._doc.write('<html></html>');
			this._doc.parentWindow.s = this;
			this._doc.close();
			
			var _iframeC = this._doc.createElement('div');
			this._doc.body.appendChild(_iframeC);
			this._iframe = this._doc.createElement('iframe');
			_iframeC.appendChild(this._iframe);
			this._iframe.src = this._prepareUrl() + '/' + (+ new Date);
		};
		
		HTMLFile.prototype._ = function(data, doc){
			this._onData(data);
			var script = doc.getElementsByTagName('script')[0];
			script.parentNode.removeChild(script);
		};
		
		  HTMLFile.prototype._destroy = function(){
			    if (this._iframe){
				      this._iframe.src = 'about:blank';
				      this._doc = null;
				      CollectGarbage();
			    }
		  };
		
		HTMLFile.prototype.disconnect = function(){
			this._destroy();
			return io.Transport.XHR.prototype.disconnect.call(this);
		};
		
		HTMLFile.check = function(){
			if ('ActiveXObject' in window){
				try {
					var a = new ActiveXObject('htmlfile');
					return a && io.Transport.XHR.check();
				} catch(e){}
			}
			return false;
		};
		
		HTMLFile.xdomainCheck = function(){
			// we can probably do handling for sub-domains, we should test that it's cross domain but a subdomain here
			return false;
		};
		
	})();
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var XHRMultipart = io.Transport['xhr-multipart'] = function(){
			io.Transport.XHR.apply(this, arguments);
		};
		
		io.util.inherit(XHRMultipart, io.Transport.XHR);
		
		XHRMultipart.prototype.type = 'xhr-multipart';
		
		XHRMultipart.prototype._get = function(){
			var self = this;
			this._xhr = this._request('', 'GET', true);
			this._xhr.onreadystatechange = function(){
				if (self._xhr.readyState == 4) self._onData(self._xhr.responseText);
			};
			this._xhr.send(null);
		};
		
		XHRMultipart.check = function(){
			return 'XMLHttpRequest' in window && 'prototype' in XMLHttpRequest && 'multipart' in XMLHttpRequest.prototype;
		};
		
		XHRMultipart.xdomainCheck = function(){
			return true;
		};
		
	})();
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var empty = new Function(),
		
		XHRPolling = io.Transport['xhr-polling'] = function(){
			io.Transport.XHR.apply(this, arguments);
		};
		
		io.util.inherit(XHRPolling, io.Transport.XHR);
		
		XHRPolling.prototype.type = 'xhr-polling';
		
		XHRPolling.prototype.connect = function(){
			if (io.util.ios || io.util.android){
				var self = this;
				io.util.load(function(){
					setTimeout(function(){
						io.Transport.XHR.prototype.connect.call(self);
					}, 10);
				});
			} else {
				io.Transport.XHR.prototype.connect.call(this);
			}
		};
		
		XHRPolling.prototype._get = function(){
			var self = this;
			this._xhr = this._request(+ new Date, 'GET');
			    this._xhr.onreadystatechange = function(){
				      var status;
				      if (self._xhr.readyState == 4){
					        self._xhr.onreadystatechange = empty;
					        try { status = self._xhr.status; } catch(e){}
					        if (status == 200){
						          self._onData(self._xhr.responseText);
						          self._get();
					        } else {
						          self._onDisconnect();
					        }
				      }
			    };
			this._xhr.send(null);
		};
		
		XHRPolling.check = function(){
			return io.Transport.XHR.check();
		};
		
		XHRPolling.xdomainCheck = function(){
			return io.Transport.XHR.xdomainCheck();
		};
		
	})();
	
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	io.JSONP = [];
	
	JSONPPolling = io.Transport['jsonp-polling'] = function(){
		io.Transport.XHR.apply(this, arguments);
		this._insertAt = document.getElementsByTagName('script')[0];
		this._index = io.JSONP.length;
		io.JSONP.push(this);
	};
	
	io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);
	
	JSONPPolling.prototype.type = 'jsonp-polling';
	
	JSONPPolling.prototype._send = function(data){
		var self = this;
		if (!('_form' in this)){
			var form = document.createElement('FORM'),
			    area = document.createElement('TEXTAREA'),
			    id = this._iframeId = 'socket_io_iframe_' + this._index,
			    iframe;
			
			form.style.position = 'absolute';
			form.style.top = '-1000px';
			form.style.left = '-1000px';
			form.target = id;
			form.method = 'POST';
			form.action = this._prepareUrl() + '/' + (+new Date) + '/' + this._index;
			area.name = 'data';
			form.appendChild(area);
			this._insertAt.parentNode.insertBefore(form, this._insertAt);
			document.body.appendChild(form);
			
			this._form = form;
			this._area = area;
		}
		
		function complete(){
			initIframe();
			self._posting = false;
			self._checkSend();
		};
		
		function initIframe(){
			if (self._iframe){
				self._form.removeChild(self._iframe);
			} 
			
			try {
				// ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
				iframe = document.createElement('<iframe name="'+ self._iframeId +'">');
			} catch(e){
				iframe = document.createElement('iframe');
				iframe.name = self._iframeId;
			}
			
			iframe.id = self._iframeId;
			
			self._form.appendChild(iframe);
			self._iframe = iframe;
		};
		
		initIframe();
		
		this._posting = true;
		this._area.value = data;
		
		try {
			this._form.submit();
		} catch(e){}
		
		if (this._iframe.attachEvent){
			iframe.onreadystatechange = function(){
				if (self._iframe.readyState == 'complete') complete();
			};
		} else {
			this._iframe.onload = complete;
		}
	};
	
	JSONPPolling.prototype._get = function(){
		var self = this,
		script = document.createElement('SCRIPT');
		if (this._script){
			this._script.parentNode.removeChild(this._script);
			this._script = null;
		}
		script.async = true;
		script.src = this._prepareUrl() + '/' + (+new Date) + '/' + this._index;
		script.onerror = function(){
			self._onDisconnect();
		};
		this._insertAt.parentNode.insertBefore(script, this._insertAt);
		this._script = script;
	};
	
	JSONPPolling.prototype._ = function(){
		this._onData.apply(this, arguments);
		this._get();
		return this;
	};
	
	JSONPPolling.check = function(){
		return true;
	};
	
	JSONPPolling.xdomainCheck = function(){
		return true;
	};
	/**
	 * Socket.IO client
	 * 
	 * @author Guillermo Rauch <guillermo@learnboost.com>
	 * @license The MIT license.
	 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
	 */
	
	(function(){
		
		var Socket = io.Socket = function(host, options){
			this.host = host || document.domain;
			this.options = {
				secure: false,
				document: document,
				port: document.location.port || 80,
				resource: 'socket.io',
				transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
				transportOptions: {
					'xhr-polling': {
						timeout: 25000 // based on polling duration default
					},
					'jsonp-polling': {
						timeout: 25000
					}
				},
				connectTimeout: 5000,
				tryTransportsOnConnectTimeout: true,
				rememberTransport: true
			};
			io.util.merge(this.options, options);
			this.connected = false;
			this.connecting = false;
			this._events = {};
			this.transport = this.getTransport();
			if (!this.transport && 'console' in window) console.error('No transport available');
		};
		
		Socket.prototype.getTransport = function(override){
			var transports = override || this.options.transports, match;
			if (this.options.rememberTransport && !override){
				match = this.options.document.cookie.match('(?:^|;)\\s*socketio=([^;]*)');
				if (match){
					this._rememberedTransport = true;
					transports = [decodeURIComponent(match[1])];
				}
			} 
			for (var i = 0, transport; transport = transports[i]; i++){
				if (io.Transport[transport] 
				&& io.Transport[transport].check() 
				&& (!this._isXDomain() || io.Transport[transport].xdomainCheck())){
					return new io.Transport[transport](this, this.options.transportOptions[transport] || {});
				}
			}
			return null;
		};
		
		Socket.prototype.connect = function(){
			if (this.transport && !this.connected){
				if (this.connecting) this.disconnect();
				this.connecting = true;
				this.emit('connecting', [this.transport.type]);
				this.transport.connect();
				if (this.options.connectTimeout){
					var self = this;
					this.connectTimeoutTimer = setTimeout(function(){
						if (!self.connected){
							self.disconnect();
							if (self.options.tryTransportsOnConnectTimeout && !self._rememberedTransport){
								if(!self._remainingTransports) self._remainingTransports = self.options.transports.slice(0);
								var transports = self._remainingTransports;
								while(transports.length > 0 && transports.splice(0,1)[0] != self.transport.type){}
								if(transports.length){
									self.transport = self.getTransport(transports);
									self.connect();
								}
							}
							if(!self._remainingTransports || self._remainingTransports.length == 0) self.emit('connect_failed');
						}
						if(self._remainingTransports && self._remainingTransports.length == 0) delete self._remainingTransports;
					}, this.options.connectTimeout);
				}
			}
			return this;
		};
		
		Socket.prototype.send = function(data){
			if (!this.transport || !this.transport.connected) return this._queue(data);
			this.transport.send(data);
			return this;
		};
		
		Socket.prototype.disconnect = function(){
			    if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
			this.transport.disconnect();
			return this;
		};
		
		Socket.prototype.on = function(name, fn){
			if (!(name in this._events)) this._events[name] = [];
			this._events[name].push(fn);
			return this;
		};
		
		  Socket.prototype.emit = function(name, args){
			    if (name in this._events){
				      var events = this._events[name].concat();
				      for (var i = 0, ii = events.length; i < ii; i++)
				        events[i].apply(this, args === undefined ? [] : args);
			    }
			    return this;
		  };
		
		Socket.prototype.removeEvent = function(name, fn){
			if (name in this._events){
				for (var a = 0, l = this._events[name].length; a < l; a++)
				if (this._events[name][a] == fn) this._events[name].splice(a, 1);
			}
			return this;
		};
		
		Socket.prototype._queue = function(message){
			if (!('_queueStack' in this)) this._queueStack = [];
			this._queueStack.push(message);
			return this;
		};
		
		Socket.prototype._doQueue = function(){
			if (!('_queueStack' in this) || !this._queueStack.length) return this;
			this.transport.send(this._queueStack);
			this._queueStack = [];
			return this;
		};
		
		Socket.prototype._isXDomain = function(){
			return this.host !== document.domain;
		};
		
		Socket.prototype._onConnect = function(){
			this.connected = true;
			this.connecting = false;
			this._doQueue();
			if (this.options.rememberTransport) this.options.document.cookie = 'socketio=' + encodeURIComponent(this.transport.type);
			this.emit('connect');
		};
		
		Socket.prototype._onMessage = function(data){
			this.emit('message', [data]);
		};
		
		Socket.prototype._onDisconnect = function(){
			var wasConnected = this.connected;
			this.connected = false;
			this.connecting = false;
			this._queueStack = [];
			if (wasConnected) this.emit('disconnect');
		};
		
		  Socket.prototype.fire = Socket.prototype.emit;
		
		Socket.prototype.addListener = Socket.prototype.addEvent = Socket.prototype.addEventListener = Socket.prototype.on;
		
	})();
	
	/*SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
	*/
	var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
	/*
	/*
	Copyright 2006 Adobe Systems Incorporated
	
	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
	
	 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
	
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
	OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	*/
	
	
	/*
	 * The Bridge class, responsible for navigating AS instances
	 */
	function FABridge(target,bridgeName)
	{
		    this.target = target;
		    this.remoteTypeCache = {};
		    this.remoteInstanceCache = {};
		    this.remoteFunctionCache = {};
		    this.localFunctionCache = {};
		    this.bridgeID = FABridge.nextBridgeID++;
		    this.name = bridgeName;
		    this.nextLocalFuncID = 0;
		    FABridge.instances[this.name] = this;
		    FABridge.idMap[this.bridgeID] = this;
		
		    return this;
	}
	
	// type codes for packed values
	FABridge.TYPE_ASINSTANCE =  1;
	FABridge.TYPE_ASFUNCTION =  2;
	
	FABridge.TYPE_JSFUNCTION =  3;
	FABridge.TYPE_ANONYMOUS =   4;
	
	FABridge.initCallbacks = {};
	FABridge.userTypes = {};
	
	FABridge.addToUserTypes = function()
	{
		for (var i = 0; i < arguments.length; i++)
		{
			FABridge.userTypes[arguments[i]] = {
				'typeName': arguments[i], 
				'enriched': false
			};
		}
	}
	
	FABridge.argsToArray = function(args)
	{
		    var result = [];
		    for (var i = 0; i < args.length; i++)
		    {
			        result[i] = args[i];
		    }
		    return result;
	}
	
	function instanceFactory(objID)
	{
		    this.fb_instance_id = objID;
		    return this;
	}
	
	function FABridge__invokeJSFunction(args)
	{  
		    var funcID = args[0];
		    var throughArgs = args.concat();//FABridge.argsToArray(arguments);
		    throughArgs.shift();
		   
		    var bridge = FABridge.extractBridgeFromID(funcID);
		    return bridge.invokeLocalFunction(funcID, throughArgs);
	}
	
	FABridge.addInitializationCallback = function(bridgeName, callback)
	{
		    var inst = FABridge.instances[bridgeName];
		    if (inst != undefined)
		    {
			        callback.call(inst);
			        return;
		    }
		
		    var callbackList = FABridge.initCallbacks[bridgeName];
		    if(callbackList == null)
		    {
			        FABridge.initCallbacks[bridgeName] = callbackList = [];
		    }
		
		    callbackList.push(callback);
	}
	
	// updated for changes to SWFObject2
	function FABridge__bridgeInitialized(bridgeName) {
		    var objects = document.getElementsByTagName("object");
		    var ol = objects.length;
		    var activeObjects = [];
		    if (ol > 0) {
			for (var i = 0; i < ol; i++) {
				if (typeof objects[i].SetVariable != "undefined") {
					activeObjects[activeObjects.length] = objects[i];
				}
			}
		}
		    var embeds = document.getElementsByTagName("embed");
		    var el = embeds.length;
		    var activeEmbeds = [];
		    if (el > 0) {
			for (var j = 0; j < el; j++) {
				if (typeof embeds[j].SetVariable != "undefined") {
					            activeEmbeds[activeEmbeds.length] = embeds[j];
				            }
			        }
		    }
		    var aol = activeObjects.length;
		    var ael = activeEmbeds.length;
		    var searchStr = "bridgeName="+ bridgeName;
		    if ((aol == 1 && !ael) || (aol == 1 && ael == 1)) {
			    FABridge.attachBridge(activeObjects[0], bridgeName); 
		    }
		    else if (ael == 1 && !aol) {
			    FABridge.attachBridge(activeEmbeds[0], bridgeName);
		        }
		    else {
			                var flash_found = false;
			if (aol > 1) {
				for (var k = 0; k < aol; k++) {
					 var params = activeObjects[k].childNodes;
					 for (var l = 0; l < params.length; l++) {
						var param = params[l];
						if (param.nodeType == 1 && param.tagName.toLowerCase() == "param" && param["name"].toLowerCase() == "flashvars" && param["value"].indexOf(searchStr) >= 0) {
							FABridge.attachBridge(activeObjects[k], bridgeName);
							                            flash_found = true;
							                            break;
						                        }
					                    }
					                if (flash_found) {
						                    break;
					                }
				            }
			        }
			if (!flash_found && ael > 1) {
				for (var m = 0; m < ael; m++) {
					var flashVars = activeEmbeds[m].attributes.getNamedItem("flashVars").nodeValue;
					if (flashVars.indexOf(searchStr) >= 0) {
						FABridge.attachBridge(activeEmbeds[m], bridgeName);
						break;
					    }
				            }
			        }
		    }
		    return true;
	}
	
	// used to track multiple bridge instances, since callbacks from AS are global across the page.
	
	FABridge.nextBridgeID = 0;
	FABridge.instances = {};
	FABridge.idMap = {};
	FABridge.refCount = 0;
	
	FABridge.extractBridgeFromID = function(id)
	{
		    var bridgeID = (id >> 16);
		    return FABridge.idMap[bridgeID];
	}
	
	FABridge.attachBridge = function(instance, bridgeName)
	{
		    var newBridgeInstance = new FABridge(instance, bridgeName);
		
		    FABridge[bridgeName] = newBridgeInstance;
		
		/*  FABridge[bridgeName] = function() {
			        return newBridgeInstance.root();
		    }
		*/
		    var callbacks = FABridge.initCallbacks[bridgeName];
		    if (callbacks == null)
		    {
			        return;
		    }
		    for (var i = 0; i < callbacks.length; i++)
		    {
			        callbacks[i].call(newBridgeInstance);
		    }
		    delete FABridge.initCallbacks[bridgeName]
	}
	
	// some methods can't be proxied.  You can use the explicit get,set, and call methods if necessary.
	
	FABridge.blockedMethods =
	{
		    toString: true,
		    get: true,
		    set: true,
		    call: true
	};
	
	FABridge.prototype =
	{
		
		
		// bootstrapping
		
		    root: function()
		    {
			        return this.deserialize(this.target.getRoot());
		    },
		//clears all of the AS objects in the cache maps
		    releaseASObjects: function()
		    {
			        return this.target.releaseASObjects();
		    },
		//clears a specific object in AS from the type maps
		    releaseNamedASObject: function(value)
		    {
			        if(typeof(value) != "object")
			        {
				            return false;
			        }
			        else
			        {
				            var ret =  this.target.releaseNamedASObject(value.fb_instance_id);
				            return ret;
			        }
		    },
		//create a new AS Object
		    create: function(className)
		    {
			        return this.deserialize(this.target.create(className));
		    },
		
		
		    // utilities
		
		    makeID: function(token)
		    {
			        return (this.bridgeID << 16) + token;
		    },
		
		
		    // low level access to the flash object
		
		//get a named property from an AS object
		    getPropertyFromAS: function(objRef, propName)
		    {
			        if (FABridge.refCount > 0)
			        {
				            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
			        }
			        else
			        {
				            FABridge.refCount++;
				            retVal = this.target.getPropFromAS(objRef, propName);
				            retVal = this.handleError(retVal);
				            FABridge.refCount--;
				            return retVal;
			        }
		    },
		//set a named property on an AS object
		    setPropertyInAS: function(objRef,propName, value)
		    {
			        if (FABridge.refCount > 0)
			        {
				            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
			        }
			        else
			        {
				            FABridge.refCount++;
				            retVal = this.target.setPropInAS(objRef,propName, this.serialize(value));
				            retVal = this.handleError(retVal);
				            FABridge.refCount--;
				            return retVal;
			        }
		    },
		
		//call an AS function
		    callASFunction: function(funcID, args)
		    {
			        if (FABridge.refCount > 0)
			        {
				            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
			        }
			        else
			        {
				            FABridge.refCount++;
				            retVal = this.target.invokeASFunction(funcID, this.serialize(args));
				            retVal = this.handleError(retVal);
				            FABridge.refCount--;
				            return retVal;
			        }
		    },
		//call a method on an AS object
		    callASMethod: function(objID, funcName, args)
		    {
			        if (FABridge.refCount > 0)
			        {
				            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
			        }
			        else
			        {
				            FABridge.refCount++;
				            args = this.serialize(args);
				            retVal = this.target.invokeASMethod(objID, funcName, args);
				            retVal = this.handleError(retVal);
				            FABridge.refCount--;
				            return retVal;
			        }
		    },
		
		    // responders to remote calls from flash
		
		    //callback from flash that executes a local JS function
		    //used mostly when setting js functions as callbacks on events
		    invokeLocalFunction: function(funcID, args)
		    {
			        var result;
			        var func = this.localFunctionCache[funcID];
			
			        if(func != undefined)
			        {
				            result = this.serialize(func.apply(null, this.deserialize(args)));
			        }
			
			        return result;
		    },
		
		    // Object Types and Proxies
		
		    // accepts an object reference, returns a type object matching the obj reference.
		    getTypeFromName: function(objTypeName)
		    {
			        return this.remoteTypeCache[objTypeName];
		    },
		    //create an AS proxy for the given object ID and type
		    createProxy: function(objID, typeName)
		    {
			        var objType = this.getTypeFromName(typeName);
			        instanceFactory.prototype = objType;
			        var instance = new instanceFactory(objID);
			        this.remoteInstanceCache[objID] = instance;
			        return instance;
		    },
		    //return the proxy associated with the given object ID
		    getProxy: function(objID)
		    {
			        return this.remoteInstanceCache[objID];
		    },
		
		    // accepts a type structure, returns a constructed type
		    addTypeDataToCache: function(typeData)
		    {
			        var newType = new ASProxy(this, typeData.name);
			        var accessors = typeData.accessors;
			        for (var i = 0; i < accessors.length; i++)
			        {
				            this.addPropertyToType(newType, accessors[i]);
			        }
			
			        var methods = typeData.methods;
			        for (var i = 0; i < methods.length; i++)
			        {
				            if (FABridge.blockedMethods[methods[i]] == undefined)
				            {
					                this.addMethodToType(newType, methods[i]);
				            }
			        }
			
			
			        this.remoteTypeCache[newType.typeName] = newType;
			        return newType;
		    },
		
		    //add a property to a typename; used to define the properties that can be called on an AS proxied object
		    addPropertyToType: function(ty, propName)
		    {
			        var c = propName.charAt(0);
			        var setterName;
			        var getterName;
			        if(c >= "a" && c <= "z")
			        {
				            getterName = "get" + c.toUpperCase() + propName.substr(1);
				            setterName = "set" + c.toUpperCase() + propName.substr(1);
			        }
			        else
			        {
				            getterName = "get" + propName;
				            setterName = "set" + propName;
			        }
			        ty[setterName] = function(val)
			        {
				            this.bridge.setPropertyInAS(this.fb_instance_id, propName, val);
			        }
			        ty[getterName] = function()
			        {
				            return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
			        }
		    },
		
		    //add a method to a typename; used to define the methods that can be callefd on an AS proxied object
		    addMethodToType: function(ty, methodName)
		    {
			        ty[methodName] = function()
			        {
				            return this.bridge.deserialize(this.bridge.callASMethod(this.fb_instance_id, methodName, FABridge.argsToArray(arguments)));
			        }
		    },
		
		    // Function Proxies
		
		    //returns the AS proxy for the specified function ID
		    getFunctionProxy: function(funcID)
		    {
			        var bridge = this;
			        if (this.remoteFunctionCache[funcID] == null)
			        {
				            this.remoteFunctionCache[funcID] = function()
				            {
					                bridge.callASFunction(funcID, FABridge.argsToArray(arguments));
				            }
			        }
			        return this.remoteFunctionCache[funcID];
		    },
		    
		    //reutrns the ID of the given function; if it doesnt exist it is created and added to the local cache
		    getFunctionID: function(func)
		    {
			        if (func.__bridge_id__ == undefined)
			        {
				            func.__bridge_id__ = this.makeID(this.nextLocalFuncID++);
				            this.localFunctionCache[func.__bridge_id__] = func;
			        }
			        return func.__bridge_id__;
		    },
		
		    // serialization / deserialization
		
		    serialize: function(value)
		    {
			        var result = {};
			
			        var t = typeof(value);
			        //primitives are kept as such
			        if (t == "number" || t == "string" || t == "boolean" || t == null || t == undefined)
			        {
				            result = value;
			        }
			        else if (value instanceof Array)
			        {
				            //arrays are serializesd recursively
				            result = [];
				            for (var i = 0; i < value.length; i++)
				            {
					                result[i] = this.serialize(value[i]);
				            }
			        }
			        else if (t == "function")
			        {
				            //js functions are assigned an ID and stored in the local cache 
				            result.type = FABridge.TYPE_JSFUNCTION;
				            result.value = this.getFunctionID(value);
			        }
			        else if (value instanceof ASProxy)
			        {
				            result.type = FABridge.TYPE_ASINSTANCE;
				            result.value = value.fb_instance_id;
			        }
			        else
			        {
				            result.type = FABridge.TYPE_ANONYMOUS;
				            result.value = value;
			        }
			
			        return result;
		    },
		
		    //on deserialization we always check the return for the specific error code that is used to marshall NPE's into JS errors
		    // the unpacking is done by returning the value on each pachet for objects/arrays 
		    deserialize: function(packedValue)
		    {
			
			        var result;
			
			        var t = typeof(packedValue);
			        if (t == "number" || t == "string" || t == "boolean" || packedValue == null || packedValue == undefined)
			        {
				            result = this.handleError(packedValue);
			        }
			        else if (packedValue instanceof Array)
			        {
				            result = [];
				            for (var i = 0; i < packedValue.length; i++)
				            {
					                result[i] = this.deserialize(packedValue[i]);
				            }
			        }
			        else if (t == "object")
			        {
				            for(var i = 0; i < packedValue.newTypes.length; i++)
				            {
					                this.addTypeDataToCache(packedValue.newTypes[i]);
				            }
				            for (var aRefID in packedValue.newRefs)
				            {
					                this.createProxy(aRefID, packedValue.newRefs[aRefID]);
				            }
				            if (packedValue.type == FABridge.TYPE_PRIMITIVE)
				            {
					                result = packedValue.value;
				            }
				            else if (packedValue.type == FABridge.TYPE_ASFUNCTION)
				            {
					                result = this.getFunctionProxy(packedValue.value);
				            }
				            else if (packedValue.type == FABridge.TYPE_ASINSTANCE)
				            {
					                result = this.getProxy(packedValue.value);
				            }
				            else if (packedValue.type == FABridge.TYPE_ANONYMOUS)
				            {
					                result = packedValue.value;
				            }
			        }
			        return result;
		    },
		    //increases the reference count for the given object
		    addRef: function(obj)
		    {
			        this.target.incRef(obj.fb_instance_id);
		    },
		    //decrease the reference count for the given object and release it if needed
		    release:function(obj)
		    {
			        this.target.releaseRef(obj.fb_instance_id);
		    },
		
		    // check the given value for the components of the hard-coded error code : __FLASHERROR
		    // used to marshall NPE's into flash
		    
		    handleError: function(value)
		    {
			        if (typeof(value)=="string" && value.indexOf("__FLASHERROR")==0)
			        {
				            var myErrorMessage = value.split("||");
				            if(FABridge.refCount > 0 )
				            {
					                FABridge.refCount--;
				            }
				            throw new Error(myErrorMessage[1]);
				            return value;
			        }
			        else
			        {
				            return value;
			        }   
		    }
	};
	
	// The root ASProxy class that facades a flash object
	
	ASProxy = function(bridge, typeName)
	{
		    this.bridge = bridge;
		    this.typeName = typeName;
		    return this;
	};
	//methods available on each ASProxy object
	ASProxy.prototype =
	{
		    get: function(propName)
		    {
			        return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
		    },
		
		    set: function(propName, value)
		    {
			        this.bridge.setPropertyInAS(this.fb_instance_id, propName, value);
		    },
		
		    call: function(funcName, args)
		    {
			        this.bridge.callASMethod(this.fb_instance_id, funcName, args);
		    }, 
		    
		    addRef: function() {
			        this.bridge.addRef(this);
		    }, 
		    
		    release: function() {
			        this.bridge.release(this);
		    }
	};
	
	// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
	// License: New BSD License
	// Reference: http://dev.w3.org/html5/websockets/
	// Reference: http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol
	
	(function() {
		  
		  if (window.WebSocket) return;
		
		  var console = window.console;
		  if (!console || !console.log || !console.error) {
			    console = {log: function(){ }, error: function(){ }};
		  }
		  
		  if (!swfobject.hasFlashPlayerVersion("9.0.0")) {
			    console.error("Flash Player is not installed.");
			    return;
		  }
		  if (location.protocol == "file:") {
			    console.error(
			      "WARNING: web-socket-js doesn't work in file:///... URL " +
			      "unless you set Flash Security Settings properly. " +
			      "Open the page via Web server i.e. http://...");
		  }
		
		  WebSocket = function(url, protocol, proxyHost, proxyPort, headers) {
			    var self = this;
			    self.readyState = WebSocket.CONNECTING;
			    self.bufferedAmount = 0;
			    // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
			    // Otherwise, when onopen fires immediately, onopen is called before it is set.
			    setTimeout(function() {
				      WebSocket.__addTask(function() {
					        self.__createFlash(url, protocol, proxyHost, proxyPort, headers);
				      });
			    }, 0);
		  };
		  
		  WebSocket.prototype.__createFlash = function(url, protocol, proxyHost, proxyPort, headers) {
			    var self = this;
			    self.__flash =
			      WebSocket.__flash.create(url, protocol, proxyHost || null, proxyPort || 0, headers || null);
			    self.__flash.addEventListener("event", function(fe) {
				      // Uses setTimeout() to workaround the error:
				      // > You are trying to call recursively into the Flash Player which is not allowed.
				      setTimeout(function() { self.__handleEvents(); }, 0);
			    });
			    //console.log("[WebSocket] Flash object is ready");
		  };
		
		  WebSocket.prototype.send = function(data) {
			    if (!this.__flash || this.readyState == WebSocket.CONNECTING) {
				      throw "INVALID_STATE_ERR: Web Socket connection has not been established";
			    }
			    // We use encodeURIComponent() here, because FABridge doesn't work if
			    // the argument includes some characters. We don't use escape() here
			    // because of this:
			    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
			    // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
			    // preserve all Unicode characters either e.g. "\uffff" in Firefox.
			    var result = this.__flash.send(encodeURIComponent(data));
			    if (result < 0) { // success
			      return true;
		    } else {
			      this.bufferedAmount += result;
			      return false;
		    }
	  };
	
	  WebSocket.prototype.close = function() {
		    var self = this;
		    if (!self.__flash) return;
		    if (self.readyState == WebSocket.CLOSED || self.readyState == WebSocket.CLOSING) return;
		    self.__flash.close();
		    // Sets/calls them manually here because Flash WebSocketConnection.close cannot fire events
		    // which causes weird error:
		    // > You are trying to call recursively into the Flash Player which is not allowed.
		    self.readyState = WebSocket.CLOSED;
		    if (self.__timer) clearInterval(self.__timer);
		    if (self.onclose) {
			       // Make it asynchronous so that it looks more like an actual
			       // close event
			       setTimeout(self.onclose, 0);
		     }
	  };
	
	  /**
	   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
	   *
	   * @param {string} type
	   * @param {function} listener
	   * @param {boolean} useCapture !NB Not implemented yet
	   * @return void
	   */
	  WebSocket.prototype.addEventListener = function(type, listener, useCapture) {
		    if (!('__events' in this)) {
			      this.__events = {};
		    }
		    if (!(type in this.__events)) {
			      this.__events[type] = [];
			      if ('function' == typeof this['on' + type]) {
				        this.__events[type].defaultHandler = this['on' + type];
				        this['on' + type] = this.__createEventHandler(this, type);
			      }
		    }
		    this.__events[type].push(listener);
	  };
	
	  /**
	   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
	   *
	   * @param {string} type
	   * @param {function} listener
	   * @param {boolean} useCapture NB! Not implemented yet
	   * @return void
	   */
	  WebSocket.prototype.removeEventListener = function(type, listener, useCapture) {
		    if (!('__events' in this)) {
			      this.__events = {};
		    }
		    if (!(type in this.__events)) return;
		    for (var i = this.__events.length; i > -1; --i) {
			      if (listener === this.__events[type][i]) {
				        this.__events[type].splice(i, 1);
				        break;
			      }
		    }
	  };
	
	  /**
	   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
	   *
	   * @param {WebSocketEvent} event
	   * @return void
	   */
	  WebSocket.prototype.dispatchEvent = function(event) {
		    if (!('__events' in this)) throw 'UNSPECIFIED_EVENT_TYPE_ERR';
		    if (!(event.type in this.__events)) throw 'UNSPECIFIED_EVENT_TYPE_ERR';
		
		    for (var i = 0, l = this.__events[event.type].length; i < l; ++ i) {
			      this.__events[event.type][i](event);
			      if (event.cancelBubble) break;
		    }
		
		    if (false !== event.returnValue &&
		        'function' == typeof this.__events[event.type].defaultHandler)
		    {
			      this.__events[event.type].defaultHandler(event);
		    }
	  };
	
	  WebSocket.prototype.__handleEvents = function() {
		    // Gets events using receiveEvents() instead of getting it from event object
		    // of Flash event. This is to make sure to keep message order.
		    // It seems sometimes Flash events don't arrive in the same order as they are sent.
		    var events = this.__flash.receiveEvents();
		    for (var i = 0; i < events.length; i++) {
			      try {
				        var event = events[i];
				        if ("readyState" in event) {
					          this.readyState = event.readyState;
				        }
				        if (event.type == "open") {
					          
					          if (this.__timer) clearInterval(this.__timer);
					          if (window.opera) {
						            // Workaround for weird behavior of Opera which sometimes drops events.
						            this.__timer = setInterval(function () {
							              this.__handleEvents();
						            }, 500);
					          }
					          if (this.onopen) this.onopen();
					          
				        } else if (event.type == "close") {
					          
					          if (this.__timer) clearInterval(this.__timer);
					          if (this.onclose) this.onclose();
					          
				        } else if (event.type == "message") {
					          
					          if (this.onmessage) {
						            var data = decodeURIComponent(event.data);
						            var e;
						            if (window.MessageEvent && !window.opera) {
							              e = document.createEvent("MessageEvent");
							              e.initMessageEvent("message", false, false, data, null, null, window, null);
						            } else {
							              // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
							              e = {data: data};
						            }
						            this.onmessage(e);
					          }
					          
				        } else if (event.type == "error") {
					          
					          if (this.__timer) clearInterval(this.__timer);
					          if (this.onerror) this.onerror();
					          
				        } else {
					          throw "unknown event type: " + event.type;
				        }
			      } catch (e) {
				        console.error(e.toString());
			      }
		    }
	  };
	  
	  /**
	   * @param {object} object
	   * @param {string} type
	   */
	  WebSocket.prototype.__createEventHandler = function(object, type) {
		    return function(data) {
			      var event = new WebSocketEvent();
			      event.initEvent(type, true, true);
			      event.target = event.currentTarget = object;
			      for (var key in data) {
				        event[key] = data[key];
			      }
			      object.dispatchEvent(event, arguments);
		    };
	  };
	
	  /**
	   * Basic implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface">DOM 2 EventInterface</a>}
	   *
	   * @class
	   * @constructor
	   */
	  function WebSocketEvent(){}
	
	  /**
	   *
	   * @type boolean
	   */
	  WebSocketEvent.prototype.cancelable = true;
	
	  /**
	   *
	   * @type boolean
	   */
	  WebSocketEvent.prototype.cancelBubble = false;
	
	  /**
	   *
	   * @return void
	   */
	  WebSocketEvent.prototype.preventDefault = function() {
		    if (this.cancelable) {
			      this.returnValue = false;
		    }
	  };
	
	  /**
	   *
	   * @return void
	   */
	  WebSocketEvent.prototype.stopPropagation = function() {
		    this.cancelBubble = true;
	  };
	
	  /**
	   *
	   * @param {string} eventTypeArg
	   * @param {boolean} canBubbleArg
	   * @param {boolean} cancelableArg
	   * @return void
	   */
	  WebSocketEvent.prototype.initEvent = function(eventTypeArg, canBubbleArg, cancelableArg) {
		    this.type = eventTypeArg;
		    this.cancelable = cancelableArg;
		    this.timeStamp = new Date();
	  };
	
	
	  WebSocket.CONNECTING = 0;
	  WebSocket.OPEN = 1;
	  WebSocket.CLOSING = 2;
	  WebSocket.CLOSED = 3;
	
	  WebSocket.__tasks = [];
	
	  WebSocket.loadFlashPolicyFile = function(url) {
		    WebSocket.__addTask(function() {
			      WebSocket.__flash.loadManualPolicyFile(url);
		    });
	  }
	
	  WebSocket.__initialize = function() {
		    if (WebSocket.__swfLocation) {
			      // For backword compatibility.
			      window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
		    }
		    if (!window.WEB_SOCKET_SWF_LOCATION) {
			      console.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
			      return;
		    }
		    var container = document.createElement("div");
		    container.id = "webSocketContainer";
		    // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
		    // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
		    // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
		    // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
		    // the best we can do as far as we know now.
		    container.style.position = "absolute";
		    if (WebSocket.__isFlashLite()) {
			      container.style.left = "0px";
			      container.style.top = "0px";
		    } else {
			      container.style.left = "-100px";
			      container.style.top = "-100px";
		    }
		    var holder = document.createElement("div");
		    holder.id = "webSocketFlash";
		    container.appendChild(holder);
		    document.body.appendChild(container);
		    // See this article for hasPriority:
		    // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
		    swfobject.embedSWF(
		      WEB_SOCKET_SWF_LOCATION, "webSocketFlash",
		      "1" /* width */, "1" /* height */, "9.0.0" /* SWF version */,
		      null, {bridgeName: "webSocket"}, {hasPriority: true, allowScriptAccess: "always"}, null,
		      function(e) {
			        if (!e.success) console.error("[WebSocket] swfobject.embedSWF failed");
		      }
		    );
		    FABridge.addInitializationCallback("webSocket", function() {
			      try {
				        //console.log("[WebSocket] FABridge initializad");
				        WebSocket.__flash = FABridge.webSocket.root();
				        WebSocket.__flash.setCallerUrl(location.href);
				        WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
				        for (var i = 0; i < WebSocket.__tasks.length; ++i) {
					          WebSocket.__tasks[i]();
				        }
				        WebSocket.__tasks = [];
			      } catch (e) {
				        console.error("[WebSocket] " + e.toString());
			      }
		    });
	  };
	
	  WebSocket.__addTask = function(task) {
		    if (WebSocket.__flash) {
			      task();
		    } else {
			      WebSocket.__tasks.push(task);
		    }
	  };
	  
	  WebSocket.__isFlashLite = function() {
		    if (!window.navigator || !window.navigator.mimeTypes) return false;
		    var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
		    if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) return false;
		    return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
	  };
	
	  // called from Flash
	  window.webSocketLog = function(message) {
		    console.log(decodeURIComponent(message));
	  };
	
	  // called from Flash
	  window.webSocketError = function(message) {
		    console.error(decodeURIComponent(message));
	  };
	
	  if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
		    if (window.addEventListener) {
			      window.addEventListener("load", WebSocket.__initialize, false);
		    } else {
			      window.attachEvent("onload", WebSocket.__initialize);
		    }
	  }
	  
})();


// end module code
return module.exports
})()

// aliases
var bind = util.bind,
forEach = util.forEach,
copyArray = util.copyArray

// Create fin in the global namespace
fin = new (function(){

/**********************************
 * The core API: connect, create, *
 * observe, set & release  *
 **********************************/
/* Connect to the fin database. The callback will be called
 * once you have a connection with the server */
this.connect = function(host, port, callback) {
	if (this._socket) { throw "fin.connect has already been called" }
	this._doConnect(host, port, callback)
}

/* Create an item with the given data as properties,
 * and get notified of the new item id when it's been created */
this.create = function(properties, callback) {
	if (typeof callback != 'function') { throw 'Second argument to fin.create should be a callback' }
	for (var key in properties) {
		if (properties[key] instanceof Array && !properties[key].length) {
			delete properties[key] // For now we assume that engines treat NULL values as empty lists, a la redis
		}
	}
	this.requestResponse('create', { data:properties }, callback)
}

/* Observe an item property, and get notified any time it changes.
 * The item property may be chained (e.g. observe(1, 'driver.car.model')),
 *  assuming that driver.car will resolve to an item ID */
this.observe = function(itemID, propName, callback) {
	if (typeof itemID != 'number' || !propName || !callback) { throw 'observe requires three arguments: '+[itemId, propName, callback?'function':callback].join(' ') }
	return this._observeChain(itemID, propName, 0, callback, {})
}

/* Mutate a fin item with the given operation */
this.set = function(itemID, propName, value) {
	this._mutate('set', itemID, propName, [value])
}

/* Release an observation */
this.release = function(subId) {
	var key = this._subIdToKey[subId],
	keyInfo = keys.getKeyInfo(key),
	itemID = keyInfo.id
	
	this._subscriptionPool.remove(key, subId)
	
	if (this._subscriptionPool.count(key) == 0) {
		if (itemID != this._localID) {
			this.request('unsubscribe', { id:itemID, property:keyInfo.property })
		}
		delete this._mutationCache[key]
		delete this._listLength[key]
	}
	
	delete this._subIdToKey[subId]
	if (this._chainDependants[subId]) {
		this.release(this._chainDependants[subId])
		delete this._chainDependants[subId]
	}
}

/* Get the last cached mutation of a currently observed item property */
this.getCachedMutation = function(itemName, propName) {
	var itemID = this._getItemID(itemName),
	key = keys.getItemPropertyKey(itemID, propName)
	
	return this._mutationCache[key]
}

/***********
 * Set API *
 ***********/
/* Observe a set of values */
this.observeSet = function(itemName, propName, callback) {
	this._observe({ id: itemName, property: propName, type: 'SET' }, callback)
}
/* Add a value to a set */
this.addToSet = function(itemName, propName, member) {
	this._mutate('sadd', itemName, propName, [member])
}
/* Remove a value from a set */
this.removeFromSet = function(itemName, propName, member) {
	this._mutate('srem', itemName, propName, [member])
}

/************
 * List API *
 ************/
/* Observe an item property list, and get notified any time it changes */
this.observeList = function(itemID, propName, callback, length) {
	if (typeof itemID != 'number' || !propName || !callback) { throw 'observe requires at least three arguments: '+[itemName, propName, callback?'function':callback, length].join(' ') }
	
	var subId = this._observeChain(itemID, propName, 0, callback, { snapshot: false })
	
	this.extendList(itemID, propName, length)
	return subId
}

/* Extend the history of an observed list */
this._listLength = {}
this.extendList = function(id, prop, extendToIndex) {
	if (typeof id != 'number' || !prop) { throw 'extendList requires a numeric ID and a property: '+[itemID, prop].join(' ') }
	
	this._resolvePropertyChain(id, prop, bind(this, function(resolved) {
		var itemID = this._getItemID(resolved.id),
		property = resolved.property,
		listKey = keys.getItemPropertyKey(itemID, property),
		listLength = this._listLength[listKey] || 0
		
		if (extendToIndex <= listLength) { return }
		this._listLength[listKey] = extendToIndex
		
		var extendArgs = { id:itemID, property:property, from:listLength }
		if (extendToIndex) { extendArgs.to = extendToIndex }
		this.requestResponse('extend_list', extendArgs, bind(this, function(items) {
			var mockMutation = { id: itemID, property: property, op: 'push', args: items, index: listLength }
			this._handleMutation(mockMutation)
		}))
	}))
}
/* Add a value onto the end of a list */
this.push = function(itemId, propName /*, val1, val2, ... */) {
	var values = Array.prototype.slice.call(arguments, 2)
	this._listOp(itemId, propName, 'push', values)
}
/* Add a value at the beginning of a list */
this.unshift = function(itemId, propName /*, val1, val2, ... */) {
	var values = Array.prototype.slice.call(arguments, 2)
	this._listOp(itemId, propName, 'unshift', values)
}

/********************
 * Miscelaneous API *
 ********************/
/* Make a custom request to the server */
this.request = function(request, args, transactionSensitive) {
	args = args || {}
	args.request = request
	this._send(args, transactionSensitive)
}

/* Make a custom request to the server that expects an explicit response in the callback */
this.requestResponse = function(request, args, callback, transactionSensitive) {
	var requestId = this._scheduleCallback(callback)
	args.request = request
	args._requestId = requestId
	this._send(args, transactionSensitive)
}

this._send = function(args, transactionSensitive) {
	var currentTransactionID = this._transactionStack[this._transactionStack.length - 1]
	if (currentTransactionID && transactionSensitive) {
		this._transactions[currentTransactionID].actions.push(args)
		return
	}
	this._socket.send(args)
}

/* Handle a custom server event */
this.handle = function(messageType, handler) {
	this._eventHandlers[messageType] = handler
}

/*
 * Make a transaction of multiple mutations; either
 * all or none of the mutations will happen
 */
this.transact = function(transactionFn) {
	var id = 't' + this._uniqueRequestId++
	this._transactions[id] = { waitingFor:1, actions:[] }
	this._transactionStack.push(id)
	transactionFn(id)
	this._endTransaction(id)
}

this._endTransaction = function(transactionID) {
	var id = this._transactionStack.pop()
	if (id != transactionID) { throw 'transaction ID mismatch in _endTransaction! '+id+' '+transactionID }
	if (--this._transactions[id].waitingFor) { return }
	this.request('transact', { actions: this._transactions[id].actions })
	delete this._transactions[id]
}

var emptyTransactionHold = { resume:function(){}, complete:function(){} }
this._holdTransaction = function() {
	var transactionID = this._transactionStack[this._transactionStack.length - 1]
	if (!transactionID) { return emptyTransactionHold }
	
	this._transactions[transactionID].waitingFor++
	
	var resume = function() { fin._transactionStack.push(transactionID) }
	var complete = function() { fin._endTransaction(transactionID) }
	
	return {
		resume: resume,
		complete: complete
	}
}

/* 
 * Focus an item property for editing. Any other focused client gets blurred.
 * When another client requests focus, onBlurCallback gets called
 */
this.focus = function(itemId, propName, onBlurCallback) {
	var sessionId = this._client.getSessionID(),
	focusProp = keys.getFocusProperty(propName),
	sendFocusInfo = { session: sessionId, user: gUserId, time: this.now() },
	subId, observation, releaseFn
	
	this.set(itemId, focusProp, JSON.stringify(sendFocusInfo))
	
	observation = { id: itemId, property: focusProp, useCache: false, snapshot: false }
	subId = this._observe(observation, bind(this, function(mutation, focusJSON) {
		if (!subId) { return }
		
		var focusInfo
		try { focusInfo = JSON.parse(focusJSON) }
		catch(e) { } // There are old focus keys sitting around with non JSON values
		
		if (!focusInfo || focusInfo.session == sessionId) { return }
		
		releaseFn()
		onBlurCallback(focusInfo)
	}))
	
	releaseFn = bind(this, function () {
		if (!subId) { return }
		this.release(subId)
		subId = null
		this.set(itemId, focusProp, null)
	})
	
	return releaseFn
}

/* Get approximately the current server time */
// TODO The timestamp should be offset by a time given by the server
this.now = function() { return new Date().getTime() }

/*******************
 * Private methods *
 *******************/
this._init = function() {
	this._requestCallbacks = {}
	this._eventHandlers = {}
	this._transactions = {}
	this._transactionStack = []
	this.handle('mutation', bind(this, '_onMutationMessage'))
}

this._doConnect = function(host, port, callback) {
	this._socket = new io.Socket(host, {
		port: port,
		connectTimeout: 500,
		transports: 'websocket,xhr-multipart,flashsocket,htmlfile,xhr-polling,jsonp-polling'.split(',')
	})
	
	this._socket
	.on('connect', bind(this, callback))
	.on('message', bind(this, '_handleMessage'))
	.on('disconnect', bind(this, '_handleDisconnect'))
	
	this._socket.connect()
}

this._onMutationMessage = function(data) {
	var mutation = JSON.parse(data)
	this._handleMutation(mutation)
}

this._handleMessage = function(message) {
	if (message.response) {
		this._executeCallback(message.response, message.data)
	} else if (this._eventHandlers[message.event]) {
		this._eventHandlers[message.event](message.data)
	} else {
		throw 'received unknown message: '+JSON.stringify(message)
	}
}

this._handleDisconnect = function() {
	console.log('_handleDisconnect', arguments)
}

this._listOp = function(itemId, propName, op, values) {
	this._mutate(op, itemId, propName, values)
}

// Observe a chain of item properties, e.g. observe(1, 'driver.car.model')
this._chainDependants = {}
this._observeChain = function(itemID, property, index, callback, observeArgs) {
	var propertyChain = (typeof property == 'string' ? property.split('.') : property),
	property = propertyChain[index],
	subID, dependantSubID, lastSubItemID
	
	if (index == propertyChain.length - 1) {
		observeArgs.id = itemID
		observeArgs.property = property
		return this._observe(observeArgs, callback)
	} else {
		return subID = this._observe({ id: itemID, property: property }, bind(this, function(mutation, subItemID) {
			if (subItemID == lastSubItemID) { return }
			lastSubItemID = subItemID
			if (dependantSubID) { this.release(dependantSubID) }
			dependantSubID = this._observeChain(subItemID, propertyChain, index + 1, callback, observeArgs)
			this._chainDependants[subID] = dependantSubID
		}))
	}
}

this._getItemID = function(itemName) {
	return itemName == 'LOCAL' ? this._localID
	: itemName == 'GLOBAL' ? this._globalID
	: itemName
}

this._subIdToKey = {}
this._subscriptionPool = new Pool()
this._observe = function(params, callback) {
	var itemID = this._getItemID(params.id),
	property = params.property,
	pool = this._subscriptionPool,
	key = keys.getItemPropertyKey(itemID, property),
	subId = pool.add(key, callback),
	type = params.type || 'BYTES',
	cachedMutation = this._mutationCache[key]
	
	if (itemID == this._localID && !cachedMutation) {
		cachedMutation = this._getNullMutation(type)
	}
	
	if (itemID != this._localID && pool.count(key) == 1) {
		if (typeof itemID != 'number') { throw 'Expected numeric ID but got: '+itemID }
		var request = { id:itemID, property:property, type:type }
		if (typeof params.snapshot != 'undefined') {
			request.snapshot = params.snapshot
		}
		this.request('observe', request)
	} else if (cachedMutation && params.useCache !== false) {
		this._handleMutation(cachedMutation, callback)
	}
	
	this._subIdToKey[subId] = key
	return subId
}

this._getNullMutation = function(type) {
	var mutation
	switch(type) {
		case 'LIST':
		mutation = { op: 'push', args: [] }
		case 'BYTES': // fall through
		default:
		mutation = { op: 'set', args: [''], value: '' }
	}
	return mutation
}

this._resolvePropertyChain = function(id, property, callback) {
	// TODO Do we need a _getItemID here?
	var propertyChain = (typeof property == 'string' ? property.split('.') : copyArray(property))
	propertyChain.pop() // for foo.bar.cat, we're trying to resolve the item ID of foo.bar
	if (!propertyChain.length) {
		callback(this._resolveCachedPropertyChain(id, property))
	} else {
		var subID = this._observeChain(id, propertyChain, 0, bind(this, function() {
			callback(this._resolveCachedPropertyChain(id, property))
			// observeChain can yielf synchronously - ensure subID has been assigned
			setTimeout(bind(this, function() { this.release(subID) }), 0)
		}), {})
	}
}

this._resolveCachedPropertyChain = function(id, property) {
	var propertyChain = (typeof property == 'string' ? property.split('.') : copyArray(property))
	// TODO Do we need a _getItemID here?
	while (propertyChain.length > 1) {
		id = this.getCachedMutation(id, propertyChain.shift()).value
	}
	return { id: id, property: propertyChain[0] }
}

this._localID = -1
this._globalID = 0
this._mutate = function(op, id, prop, args) {
	var resolved = this._resolveCachedPropertyChain(id, prop),
	itemID = this._getItemID(resolved.id)
	
	var mutation = {
		op: op,
		args: args,
		id: itemID,
		property: resolved.property
	}
	
	if (itemID != this._localID) { this.request('mutate', { mutation:mutation }, true) }
	
	this._handleMutation(mutation)
}

this._deserializeMutation = function(mutation) {
	var args = mutation.args,
	operation = mutation.op
	switch(operation) {
		case 'set':
		mutation.value = args[0]
		break
		case 'push':
		case 'unshift':
		case 'sadd':
		case 'srem':
		for (var i=0; i < args.length; i++) { args[i] = args[i] }
		break
		case 'increment':
		case 'decrement':
		if (args.length) { throw 'Argument for operation without signature: '+operation }
		break
		case 'add':
		case 'subtract':
		if (args.length != 1) { throw 'Missing argument for: '+operation }
		break
		default: throw 'Unknown operation for deserialization: '+operation
	}
}

this._mutationCache = {}
this._handleMutation = function(mutation, singleCallback) {
	if (singleCallback) {
		var args = [mutation.op].concat(mutation.args)
		singleCallback(mutation, mutation.value)
	} else {
		var key = keys.getItemPropertyKey(mutation.id, mutation.property),
		subs = this._subscriptionPool.get(key)
		
		this._deserializeMutation(mutation)
		this._cacheMutation(mutation, key)
		
		for (var subId in subs) {
			subs[subId](mutation, mutation.value)
		}
	}
}

this._cacheMutation = function(mutation, key) {
	var mutationCache = this._mutationCache,
	cachedMutation = mutationCache[key],
	cachedArgs = cachedMutation && cachedMutation.args,
	cachedValue = cachedMutation && cachedMutation.value
	
	if (!cachedMutation) {
		return mutationCache[key] = mutation
	}
	
	switch(mutation.op) {
		case 'set':
		mutationCache[key] = mutation
		break
		case 'push':
		cachedMutation.args = cachedMutation.args.concat(mutation.args)
		break
		case 'unshift':
		cachedMutation.args = mutation.args.concat(cachedMutation.args)
		break
		case 'sadd':
		for (var i=0, itemId; itemId = mutation.args[i]; i++) {
			if (cachedArgs.indexOf(itemId) == -1) { cachedArgs.push(itemId) }
		}
		break
		case 'srem':
		for (var i=0, itemId; itemId = mutation.args[i]; i++) {
			cachedArgs.splice(cachedArgs.indexOf(itemId), 1)
		}
		break
		case 'increment':
		cachedMutation.value = mutation.value = (cachedValue || 0) + 1
		break
		case 'decrement':
		cachedMutation.value = mutation.value = (cachedValue || 0) - 1
		break
		case 'add':
		cachedMutation.value = mutation.value = (cachedValue || 0) + mutation.args[0]
		break
		case 'subtract':
		cachedMutation.value = mutation.value = (cachedValue || 0) - mutation.args[0]
		break
		default:
		throw 'Unknown operation for caching: '+mutation.op
	}
	return mutationCache[key]
}

this._uniqueRequestId = 0
this._scheduleCallback = function(callback) {
	var requestId = 'r' + this._uniqueRequestId++
	this._requestCallbacks[requestId] = callback
	return requestId
}

this._executeCallback = function(requestId, response) {
	var callback = this._requestCallbacks[requestId]
	delete this._requestCallbacks[requestId]
	callback(response)
}

this._init()
})()
