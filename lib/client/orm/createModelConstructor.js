module.exports = {
	_instantiate: _instantiate,
	create: create
}

var propertyModels = require('./propertyModels'),
	util = require('../../shared/util'),
	unique = require('std/unique'),
	each = require('std/each'),
	bind = require('std/bind'),
	defineGetter = require('std/defineGetter')

function _instantiate(idOrValues) {
	var values
	if (typeof idOrValues == 'number') { this._guid = idOrValues }
	else { values = idOrValues }
	values = values || {}
	
	for (var propertyName in this._constructor.description) {
		var value = values[propertyName],
			description = this._constructor.description[propertyName],
			delayedProperty = bind(this, _instantiateProperty, propertyName, value, description)
		defineGetter(this, propertyName, delayedProperty)
	}
	
	this._oid = unique()

	// When a model is instantiated with a set of properties,
	//  we want to go ahead and create then item server-side
	//  right away.
	if (this._guid === undefined && idOrValues !== undefined) { create.call(this) }
}

var _instantiateProperty = function(propertyName, value, propertyDescription) {
	var type = propertyDescription.type
	if (fin.orm[type]) {
		if (typeof value != 'object') {
			var Model = fin.orm[type]
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
	if (this._guid) { return this } // already created
	_waitForPropertyIDs(this, function() {
		_createInDatabase(this, function(newID) {
			this._guid = newID
			each(this._waitingForID, function(fn) { fn(newID) })
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
	each(model._constructor.description, function(propertyDescription, propertyName) {
		var property = model[propertyName],
			value = (fin.orm[propertyDescription.type] ? property._guid : property._value)
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
	each(model._constructor.description, function(propertyDescription, propertyName) {
		if (propertyModels[propertyDescription.type]) { return }
		waitingFor++
		fin.orm.waitForGUID(model[propertyName], tryNow)
	})
	tryNow()
}

var waitForGUID = function(model, callback) {
	if (model._guid !== undefined) { callback(model._guid) }
	else if (model._waitingForID) { model._waitingForID.push(callback) }
	else { model._waitingForID = [callback] }
}
