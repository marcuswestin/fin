module.exports = {
	_instantiate: _instantiate,
	create: create
}

function _instantiate(idOrValues) {
	var values
	if (typeof idOrValues == 'number') { this._id = idOrValues }
	else { values = idOrValues || {} }
	
	for (var propertyName in this._constructor.description) {
		var propertyDescription = this._constructor.description[propertyName],
			valueType = propertyDescription.type,
			Model = propertyModels[valueType] || customModels[valueType],
			value = values[propertyName]
		
		this[propertyName] = new Model(value)
	}
}

function create() {
	if (this._id) { return this } // already created
	_waitForPropertyIDs(this, function() {
		_createModelOnServer(this, function(newID) {
			this._id = newID
		})
	})
	return this
}

/* Util
 ******/
var _createModelOnServer = function(model, callback) {
	fin.create(model._currentValues(), function(newID) {
		callback.call(model, newID)
	})
}

var _waitForPropertyIDs = function(model, callback) {
	var waitingFor = 0
	function tryNow() {
		if (waitingFor) { return }
		callback.call(model)
	}
	each(model._constructor.description, function(propertyDescription) {
		if (propertyModels[propertyDescription.type]) { return }
		waitingFor++
		_waitForID(model, tryNow)
	})
	tryNow()
}

var _waitForID = function(model, callback) {
	// TODO check if model has ID
	// If not, listen for it and call callback when it exists
}
