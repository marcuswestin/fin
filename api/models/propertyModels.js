module.exports = {
	"Text": ValuePropertyModel,
	"Number": ValuePropertyModel,
	"List": CollectionPropertyModel
}

var fin = require('../client'),
	propertyModels = module.exports,
	customModels = require('./'),
	util = require('../fin/util')

/* Property model types (Text/Number, List/Set)
 **********************************************/
function ValuePropertyModel(value) { this._value = value }
function CollectionPropertyModel(value, of) {
	this._value = value
	this._of = of
	this._ofCustomModel = !!customModels[this._of]
}

ValuePropertyModel.prototype = {
	observe: _modelObserve,
	on: _modelOn,
	set: _modelSet
}

CollectionPropertyModel.prototype = {
	observe: _modelObserve,
	on: _modelOn,
	push: _modelPush
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

function _modelSet(value) {
	var propertyID = this._propertyID
	customModels._waitForID(this._parent, function(itemID) {
		fin.set(itemID, [propertyID], value)
	})
}

function _modelPush(value) {
	// TODO support pushing raw values, e.g. a string if we're of("String"), or an ID number if we're of a CustomModel
	var propertyID = this._propertyID,
		parent = this._parent,
		ofCustomModel = this._ofCustomModel

	customModels._waitForID(parent, function(itemID) {
		if (ofCustomModel) {
			customModels._waitForID(value, function(valueItemID) {
				fin.push(itemID, [propertyID], valueItemID)
			})
		} else {
			fin.push(itemID, [propertyID], value._value)
		}
	})
}

/* Util function. All callbacks get called
 * in the context of the model passed in
 *****************************************/
var _observe = function(propertyModel, callback) {
	_getObservationInfo(propertyModel, function(info) {
		var of = propertyModel._of
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
	})
}

var _getObservationInfo = function(propertyModel, callback) {
	var propertyNameChain = []
	while(propertyModel._parent) {
		propertyNameChain.unshift(propertyModel._propertyID)
		propertyModel = propertyModel._parent
	}
	customModels._waitForID(propertyModel, function(id) {
		callback({ id:id, chain:propertyNameChain })
	})
}
