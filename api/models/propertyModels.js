module.exports = {
	"Text": Value,
	"Number": Value,
	"List": List,
	"Set": Set
}

var fin = require('../client'),
	propertyModels = module.exports,
	customModels = require('./'),
	util = require('../fin/util')

/* Property model types (Text/Number, List/Set)
 **********************************************/
function Value(value) { this._value = value }
function List(value, of) {
	this._value = value
	this._of = of
	this._ofCustomModel = !!customModels[this._of]
}
function Set(value, of) {
	this._value = value
	this._of = of
	this._ofCustomModel = !!customModels[this._of]
}

Value.prototype = {
	observe: _modelObserve,
	set: _modelSet
}

List.prototype = {
	observe: _modelObserve,
	on: _modelOn,
	push: _listModelPush,
	unshift: _listModelUnshift
}

Set.prototype = {
	observe: _modelObserve,
	on: _modelOn,
	add: _setModelAdd,
	remove: _setModelRemove
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

function _listModelPush(value) { _collectionOp(this, 'push', value) }
function _listModelUnshift(value) { _collectionOp(this, 'unshift', value) }

function _setModelAdd(value) { _collectionOp(this, 'sadd', value) }
function _setModelRemove(value) { _collectionOp(this, 'srem', value) }

/* Util functions. All callbacks get called
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

var _collectionOp = function(propertyModel, op, value) {
	// TODO support operating on raw values, e.g. a string if we're of("String"), or an ID number if we're of a CustomModel
	var propertyID = propertyModel._propertyID,
		parent = propertyModel._parent,
		ofCustomModel = propertyModel._ofCustomModel
	
	customModels._waitForID(parent, function(itemID) {
		if (ofCustomModel) {
			customModels._waitForID(value, function(valueItemID) {
				fin[op](itemID, [propertyID], valueItemID)
			})
		} else {
			fin[op](itemID, [propertyID], value._value)
		}
	})
}
