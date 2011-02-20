var fin = require('../client')

module.exports = {
	"Text": PropertyModel,
	"Number": PropertyModel,
	"List": PropertyModel
}

/* Property model types (Text/Number, List/Set)
 **********************************************/
function PropertyModel(value) { this._value = value }
PropertyModel.prototype = {
	observe: _modelObserve,
	on: _modelOn
}

function _modelObserve(callback) {
	_observe(this, function(mutation) {
		callback(mutation.args, mutation.op)
	})
}

function _modelOn(mutationType, callback) {
	_observe(this, function(mutation) {
		if (mutation.op != mutationType) { return }
		// TODO if this is a List/Set model, and the type "of" is a CustomModel,
		// then instantiate that model and pass it as the argument to callback
		callback(mutation.args)
	})
}

/* Util function. All callbacks get called
 * in the context of the model passed in
 *****************************************/
var _observe = function(propertyModel, callback) {
	var info = _getObservationInfo(propertyModel)
	fin.observe(info.id, info.chain, function(mutation) {
		callback.call(propertyModel, mutation)
	})
}

var _getObservationInfo = function(propertyModel) {
	var propertyNameChain = []
	
	while(propertyModel._parent) {
		propertyNameChain.push(propertyModel._propertyID)
		propertyModel = propertyModel._parent
	}
	return { id:propertyModel._id, chain:propertyNameChain }
}
