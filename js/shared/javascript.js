
exports.bind = function(context, method/*, args... */) {
	var args = Array.prototype.slice.call(arguments, 2)
	return function() {
		fn = (typeof method == 'string' ? context[method] : method)
		return fn.apply(context, args.concat(Array.prototype.slice.call(arguments, 0)))
	}
}

exports.forEach = function(items, ctx, fn) {
	if (!items) { return }
	if (!fn) { fn = ctx, ctx = this }
	if (exports.isArray(items)) {
		for (var i=0, item; item = items[i]; i++) { fn.call(ctx, item, i) }
	} else {
		for (var key in items) { fn.call(ctx, key, items[key]) }
	}
}

exports.map = function(items, fn) {
	var results = []
	exports.forEach(items, function(item) { results.push(fn(item)) })
	return results
}

exports.Class = function(parent, proto) {
	if(!proto) { proto = parent }
	proto.prototype = parent.prototype
	
	var cls = function() { if(this.init) { this.init.apply(this, arguments) }}
	cls.prototype = new proto(function(context, method, args) {
		var target = parent
		while(target = target.prototype) {
			if(target[method]) {
				return target[method].apply(context, args || [])
			}
		}
		throw new Error('supr: parent method ' + method + ' does not exist')
	})
	
	// Sometimes you want a method that renders UI to only execute once if it's called 
	// multiple times within a short time period. Delayed methods do just that
	cls.prototype.createDelayedMethod = function(methodName, fn) {
		// "this" is the class
		this[methodName] = function() {
			// now "this" is the instance. Each instance gets its own function
			var executionTimeout
			this[methodName] = bind(this, function() {
				clearTimeout(executionTimeout)
				executionTimeout = setTimeout(bind(fn, 'apply', this, arguments), 10)
			})
			this[methodName].apply(this, arguments)
		}
	}
	
	cls.prototype.constructor = cls
	return cls
}

exports.Singleton = function(parent, proto) {
	return new (exports.Class(parent, proto))()
}

var stripRegexp = /^\s*(.*?)\s*$/
exports.strip = function(str) {
	return str.match(stripRegexp)[1]
}

exports.capitalize = function(str) {
	if (!str) { return '' }
	return str[0].toUpperCase() + str.substring(1)
}

exports.isArray = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]'
}

exports.blockCallback = function(callback, opts) {
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
					throw err
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

exports.bytesToString = function(byteArray, offset) {
	return byteArray.toString();
	return String.fromCharCode.apply(String, Array.prototype.slice.call(byteArray, offset || 0))
}

exports.recall = function(self, args, timeout) {
	var fn = args.callee
	return function(){ return fn.apply(self, args) }
}

exports.assert = function(shouldBeTrue, msg, values) {
	if (shouldBeTrue) { return }
	var moreInfo = values ? (' : ' + JSON.stringify(values)) : ''
	throw new Error(msg + moreInfo)
}
