var Class = require('std/Class'),
	bind = require('std/bind'),
	each = require('std/each'),
	curry = require('std/curry')

/* Base types - Values and Collections
 *************************************/
var Base = Class(function() {
	this.init = function(propertySchema, parentItem) {
		this._propertyID = propertySchema.id
		this._parentItem = parentItem
		this._subIDs = []
	}
	
	this.observe = function(callback) {
		this._getObservationInfo(bind(this, function(info) {
			var subID = this._doObserve(info, callback)
			this._subIDs.push(subID)
		}))
		return this
	}
	
	this._getObservationInfo = function(callback) {
		var propertyNameChain = [this._propertyID],
			itemModel = this._parentItem
		while(itemModel._parentItem) {
			if (!itemModel._propertyID) { debugger }
			propertyNameChain.unshift(itemModel._propertyID)
			itemModel = itemModel._parentItem
		}
		itemModel.waitForGUID(function(id) { // itemModel is now the root item, which either must have been instantiated with a GUID, or in the process of being created and assigned a GUID
			callback({ id:id, chain:propertyNameChain })
		})
	}
})

var Value = Class(Base, function() {
	this.set = function(value) {
		var transactionHold = fin._holdTransaction()
		this._parentItem.getGUID(bind(this, function(parentItemID) {
			transactionHold.resume()
			fin.set(parentItemID, [this._propertyID], value)
			transactionHold.complete()
		}))
		return this
	}
	
	this.release = function() {
		fin.release(this._subIDs.shift())
	}
	
	this.getCachedValue = function() {
		var itemID = this._parentItem._guid,
			cachedMutation = itemID && fin.getCachedMutation(itemID, this._propertyID)
		return cachedMutation && cachedMutation.value
	}
	
	this._doObserve = function(info, callback) {
		return fin.observe(info.id, info.chain, function(mutation) {
			var value = mutation.args[0]
			callback(value, mutation.op)
		})
	}
})

var Collection = Class(Base, function() {
	this.init = function(propertySchema, parentItem) {
		Base.prototype.init.apply(this, arguments)
		this._of = propertySchema.of
		this._ofCustomModel = !!fin.orm[this._of]
	}
	
	this.on = function(mutationType, callback) {
		this.observe(bind(this, function(value, op) {
			if (op != mutationType) { return }
			callback(value, op)
		}))
		return this
	}
	
	this._doObserve = function(info, callback) {
		return fin[this._observeOperation](info.id, info.chain, bind(this, function(mutation) {
			var Model = module.exports[this._of] || fin.orm[this._of]
			each(mutation.args, function(arg) {
				callback(new Model(arg), mutation.op)
			})
		}))
	}
	
	this._collectionOperation = function(op, value) {
		// TODO support operating on raw values, e.g. a string if we're of("String"), or an ID number if we're of a CustomModel
		var transactionHold = fin._holdTransaction()

		var completeTransaction = bind(this, function(itemID, value) {
			transactionHold.resume()
			fin[op](itemID, [this._propertyID], value)
			transactionHold.complete()
		})

		this._parentItem.getGUID(bind(this, function(parentItemID) {
			if (this._ofCustomModel) {
				value.getGUID(curry(completeTransaction, parentItemID))
			} else {
				completeTransaction(parentItemID, value.getCachedValue())
			}
		}))
		return this
	}
})

/* Property model types (Text/Number, List/Set)
 **********************************************/
var Text = Class(Value, function() {
	this.type = 'Text'
})

var Number = Class(Value, function() {
	this.type = 'Number'
})

var Boolean = Class(Value, function() {
	this.type = 'Boolean'
})

var List = Class(Collection, function() {
	this.type = 'List'
	this._observeOperation = 'observeList'

	this.push = function(value) { return this._collectionOperation('push', value) }
	this.unshift = function(value) { return this._collectionOperation('unshift', value) }
})

var Set = Class(Value, function() {
	this.type = 'Set'
	this._observeOperation = 'observeSet'

	this.add = function(value) { return this._collectionOperation('addToSet', value) }
	this.remove = function(value) { return this._collectionOperation('removeFromSet', value) }
})

module.exports = {
	"Base": Base,
	"Text": Text,
	"Number": Number,
	"Boolean": Boolean,
	"List": List,
	"Set": Set
}
