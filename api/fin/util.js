module.exports = {
	bind: bind,
	curry: curry,
	Class: Class,
	blockCallback: blockCallback,
	each: each,
	map: map,
	copyArray: copyArray
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
		for (var i=0, item; item = items[i]; i++) { fn.call(ctx, item, i) }
	} else {
		for (var key in items) { fn.call(ctx, items[key], key) }
	}
}

function map(items, fn) {
	var results = []
	each(items, function(item, key) { results.push(fn(item, key)) })
	return results
}

function Class(parent, proto) {
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
// 
// function Singleton(parent, proto) {
// 	return new (exports.Class(parent, proto))()
// }

// var stripRegexp = /^\s*(.*?)\s*$/
// exports.strip = function(str) {
// 	return str.match(stripRegexp)[1]
// }
// 
// exports.capitalize = function(str) {
// 	if (!str) { return '' }
// 	return str[0].toUpperCase() + str.substring(1)
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

// 
// exports.getDependable = function() {
// 	var dependants = [],
// 		dependable = {}
// 	
// 	dependable.depend = function(onFulfilled) {
// 		dependants.push(onFulfilled)
// 		if (dependable.fulfillment) {
// 			onFulfilled.apply(this, dependable.fulfillment)
// 		}
// 	}
// 	dependable.fulfill = function() {
// 		dependable.fulfillment = arguments
// 		for (var i=0; i < dependants.length; i++) {
// 			dependants[i].apply(this, dependable.fulfillment)
// 		}
// 	}
// 	return dependable
// }
// 
// exports.assert = function(shouldBeTrue, msg, values) {
// 	if (shouldBeTrue) { return }
// 	var moreInfo = values ? (' : ' + JSON.stringify(values)) : ''
// 	throw new Error(msg + moreInfo)
// }
