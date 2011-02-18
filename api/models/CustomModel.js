module.exports = {
	_instantiate: _instantiate,
	create: create
}

var models = require('./index'),
	fin = require('../client'),
	each = require('../fin/util').each

var customModels = models

function _instantiate(idOrValues) {
	var values
	if (typeof idOrValues == 'number') { this._id = idOrValues }
	else { values = idOrValues || {} }
	
	for (var propertyName in this._constructor.description) {
		var propertyDescription = this._constructor.description[propertyName],
			valueType = propertyDescription.type,
			value = values[propertyName]
		
		if (customModels[valueType] && typeof value != 'number') {
			this[propertyName] = value
		} else {
			var Model = models._propertyModels[valueType] || customModels[valueType]
			this[propertyName] = new Model(value)
		}
	}
}

function create() {
	if (this._id) { return this } // already created
	_waitForPropertyIDs(this, function() {
		_createInDatabase(this, function(newID) {
			this._id = newID
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

function _currentValues(model) {
	var keyValuePairs = {}
	each(model._constructor.description, function(propertyDescription, propertyName) {
		var property = model[propertyName],
			value = customModels[propertyDescription.type] ? property._id : property._value
		keyValuePairs[propertyDescription.id] = value
	})
	return keyValuePairs
}

var _waitForPropertyIDs = function(model, callback) {
	var waitingFor = 0
	function tryNow() {
		if (waitingFor) { return }
		callback.call(model)
	}
	each(model._constructor.description, function(propertyDescription) {
		if (models._propertyModels[propertyDescription.type]) { return }
		waitingFor++
		_waitForID(model, tryNow)
	})
	tryNow()
}

var _waitForID = function(model, callback) {
	// TODO check if model has ID
	// If not, listen for it and call callback when it exists
}
