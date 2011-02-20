module.exports = {
	"Text": PropertyModel,
	"Number": PropertyModel,
	"List": PropertyModel
}

var fin = require('../client'),
	propertyModels = module.exports,
	customModels = require('./'),
	util = require('../fin/util')

/* Property model types (Text/Number, List/Set)
 **********************************************/
function PropertyModel(value, of) {
	this._value = value
	this._of = of
}
PropertyModel.prototype = {
	observe: _modelObserve,
	on: _modelOn
}

function _modelObserve(callback) {
	_observe(this, function(value, op) {
		callback(value, op)
	})
}

function _modelOn(mutationType, callback) {
	_observe(this, function(value, op) {
		if (op != mutationType) { return }
		callback(value, op)
	})
}

/* Util function. All callbacks get called
 * in the context of the model passed in
 *****************************************/
var _observe = function(propertyModel, callback) {
	var info = _getObservationInfo(propertyModel),
		of = propertyModel._of
	if (of) {
		fin.observeList(info.id, info.chain, function(mutation) {
			var Model = propertyModels[of] || customModels[of],
				op = mutation.op
			util.each(mutation.args, function(arg) {
				callback.call(propertyModel, new Model(arg), op)
			})
		})
	} else {
		fin.observe(info.id, info.chain, function(mutation) {
			var value = mutation.args[0]
			callback.call(propertyModel, value, mutation.op)
		})
	}
}

var _getObservationInfo = function(propertyModel) {
	var propertyNameChain = []
	while(propertyModel._parent) {
		propertyNameChain.push(propertyModel._propertyID)
		propertyModel = propertyModel._parent
	}
	return { id:propertyModel._id, chain:propertyNameChain }
}
