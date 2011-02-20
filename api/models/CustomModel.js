module.exports = {
	_instantiate: _instantiate,
	create: create
}

var fin = require('../client'),
	each = require('../fin/util').each

function _instantiate(idOrValues) {
	var values
	if (typeof idOrValues == 'number') { this._id = idOrValues }
	else { values = idOrValues }
	values = values || {}
	
	for (var propertyName in this._constructor.description) {
		var propertyDescription = this._constructor.description[propertyName],
			valueType = propertyDescription.type,
			value = values[propertyName]
		
		if (fin._customModels[valueType]) {
			if (typeof value != 'object') {
				var Model = fin._customModels[valueType]
				value = new Model(value)
			}
			this[propertyName] = value
		} else {
			var Model = fin._propertyModels[valueType]
			this[propertyName] = new Model(value, propertyDescription.of)
		}
		this[propertyName]._propertyID = propertyDescription.id
		this[propertyName]._parent = this
	}
}

function create() {
	if (this._id) { return this } // already created
	_waitForPropertyIDs(this, function() {
		_createInDatabase(this, function(newID) {
			this._id = newID
			each(this._waitingForID, function(fn) { fn() })
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

function _currentValues(model) {
	var keyValuePairs = {}
	each(model._constructor.description, function(propertyDescription, propertyName) {
		var property = model[propertyName],
			value = (fin._customModels[propertyDescription.type] ? property._id : property._value)
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
		if (fin._propertyModels[propertyDescription.type]) { return }
		waitingFor++
		_waitForID(model[propertyName], tryNow)
	})
	tryNow()
}

var _waitForID = function(model, callback) {
	if (model._id) { callback() }
	else if (model._waitingForID) { model._waitingForID.push(callback) }
	else { model._waitingForID = [callback] }
}
