jsio('from common.javascript import Class, bind')

exports = Class(function() {
	
	var fakePromise = { addErrback: function(){}, addCallback: function(){} }
	
	this.init = function() {
		this._items = {}
	}
	
	this.exists = function(callback) {
		this._answer(callback, true)
	}
	
	this.getDoc = function(itemId, callback) { 
		if (!this._items[itemId]) { this._items[itemId] = { _id: itemId, _rev: 1 } }
		this._answer(callback, null, this._items[itemId])
		return fakePromise
	}
	
	this.saveDoc = function(itemId, data, callback) {
		if (arguments.length == 2) { 
			callback = arguments[1]
			data = arguments[0]
			itemId = data._id
		}
		data._rev = this._items[itemId]._rev + 1
		this._items[itemId] = data
		this._answer(callback, null, { id: itemId, rev: data._rev })
		return fakePromise
	}
	
	this._answer = function(callback, arg1, arg2 /* ... */) {
		var args = Array.prototype.slice.call(arguments, 1)
		setTimeout(function(){ callback.apply(this, args) }, 50)
	}
})
