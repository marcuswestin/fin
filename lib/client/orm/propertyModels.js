module.exports = {
	"Text": Value,
	"Number": Value,
	"List": List,
	"Set": Set
}

var propertyModels = module.exports,
	util = require('../../shared/util')

/* Property model types (Text/Number, List/Set)
 **********************************************/
function Value(value) {
	this._value = value
	this._subIDs = []
}
function List(value, of) {
	this._value = value
	this._of = of
	this._ofCustomModel = !!fin.orm[this._of]
	this._subIDs = []
}
function Set(value, of) {
	this._value = value
	this._of = of
	this._ofCustomModel = !!fin.orm[this._of]
	this._subIDs = []
}

Value.prototype = {
	observe: _modelObserve,
	set: _modelSet,
	current: _modelCurrent,
	release: _modelRelease
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
	return this
}

function _modelOn(mutationType, callback) {
	_observe(this, function(value, op) {
		if (op != mutationType) { return }
		callback(value, op)
	})
	return this
}

function _modelSet(value) {
	var propertyID = this._propertyID,
		transactionHold = fin._holdTransaction()
	
	fin.orm.waitForGUID(this._parent, function(itemID) {
		transactionHold.resume()
		fin.set(itemID, [propertyID], value)
		transactionHold.complete()
	})
	return this
}

function _modelCurrent(value) {
	var itemID = this._parent._guid,
		cachedMutation = fin.getCachedMutation(itemID, this._propertyID)
	return cachedMutation ? cachedMutation.value : null
}

function _modelRelease() {
	fin.release(this._subIDs.shift())
}

function _listModelPush(value) { _collectionOp(this, 'push', value); return this }
function _listModelUnshift(value) { _collectionOp(this, 'unshift', value); return this }

function _setModelAdd(value) { _collectionOp(this, 'addToSet', value); return this}
function _setModelRemove(value) { _collectionOp(this, 'removeFromSet', value); return this }

/* Util functions. All callbacks get called
 * in the context of the model passed in
 *****************************************/
var _observe = function(propertyModel, callback) {
	_getObservationInfo(propertyModel, function(info) {
		var of = propertyModel._of,
			subID
		if (of) {
			var op = propertyModel instanceof Set ? 'observeSet' : 'observeList'
			subID = fin[op](info.id, info.chain, function(mutation) {
				var Model = propertyModels[of] || fin.orm[of],
					op = mutation.op
				util.each(mutation.args, function(arg) {
					callback.call(propertyModel, new Model(arg), op)
				})
			})
		} else {
			subID = fin.observe(info.id, info.chain, function(mutation) {
				var value = mutation.args[0]
				callback.call(propertyModel, value, mutation.op)
			})
		}
		propertyModel._subIDs.push(subID)
	})
}

var _getObservationInfo = function(propertyModel, callback) {
	var propertyNameChain = []
	while(propertyModel._parent) {
		propertyNameChain.unshift(propertyModel._propertyID)
		propertyModel = propertyModel._parent
	}
	fin.orm.waitForGUID(propertyModel, function(id) {
		callback({ id:id, chain:propertyNameChain })
	})
}

var _collectionOp = function(propertyModel, op, value) {
	// TODO support operating on raw values, e.g. a string if we're of("String"), or an ID number if we're of a CustomModel
	var transactionHold = fin._holdTransaction()
	
	function completeTransaction(itemID, value) {
		transactionHold.resume()
		fin[op](itemID, [propertyModel._propertyID], value)
		transactionHold.complete()
	}
	
	fin.orm.waitForGUID(propertyModel._parent, function(parentID) {
		if (propertyModel._ofCustomModel) {
			fin.orm.waitForGUID(value, function(valueID) { completeTransaction(parentID, valueID) })
		} else {
			completeTransaction(itemID, value._value)
		}
	})
}