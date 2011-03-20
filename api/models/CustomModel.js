module.exports = {
	_instantiate: _instantiate,
	create: create
}

var fin = require('../client'),
	customModels = require('./'),
	propertyModels = require('./propertyModels'),
	util = require('../fin/util')

function _instantiate(idOrValues) {
	var values
	if (typeof idOrValues == 'number') { this._id = idOrValues }
	else { values = idOrValues }
	values = values || {}
	
	for (var propertyName in this._constructor.description) {
		var value = values[propertyName],
			description = this._constructor.description[propertyName],
			delayedProperty = util.bind(this, _instantiateProperty, propertyName, value, description)
		util.defineGetter(this, propertyName, delayedProperty)
	}
}

var _instantiateProperty = function(propertyName, value, propertyDescription) {
	var type = propertyDescription.type
	if (customModels[type]) {
		if (typeof value != 'object') {
			var Model = customModels[type]
			value = new Model(value)
		}
	} else {
		var Model = propertyModels[type]
		value = new Model(value, propertyDescription.of)
	}
	delete this[propertyName]
	this[propertyName] = value
	this[propertyName]._propertyID = propertyDescription.id
	this[propertyName]._parent = this
	return this[propertyName]
}

function create() {
	if (this._id) { return this } // already created
	_waitForPropertyIDs(this, function() {
		_createInDatabase(this, function(newID) {
			this._id = newID
			util.each(this._waitingForID, function(fn) { fn(newID) })
			delete this._waitingForID
		})
	})
	return this
}

/* Util
 ******/
var _createInDatabase = function(model, callback) {
	fin.create(_currentValues(model), function(newID) {
		callback.call(model, newID)
	})
}

var _currentValues = function(model) {
	var keyValuePairs = {}
	util.each(model._constructor.description, function(propertyDescription, propertyName) {
		var property = model[propertyName],
			value = (customModels[propertyDescription.type] ? property._id : property._value)
		keyValuePairs[propertyDescription.id] = value
	})
	return keyValuePairs
}

var _waitForPropertyIDs = function(model, callback) {
	var waitingFor = 1
	function tryNow() {
		if (--waitingFor) { return }
		callback.call(model)
	}
	util.each(model._constructor.description, function(propertyDescription, propertyName) {
		if (propertyModels[propertyDescription.type]) { return }
		waitingFor++
		customModels._waitForID(model[propertyName], tryNow)
	})
	tryNow()
}

var _waitForID = function(model, callback) {
	if (model._id !== undefined) { callback(model._id) }
	else if (model._waitingForID) { model._waitingForID.push(callback) }
	else { model._waitingForID = [callback] }
}
