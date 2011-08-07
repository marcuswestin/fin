var Class = require('std/Class'),
	each = require('std/each'),
	defineGetter = require('std/defineGetter'),
	unique = require('std/unique'),
	bind = require('std/bind'),
	propertyModels = require('./propertyModels')

module.exports = function createModelConstructor(modelDescription) {
	return Class(CustomModelBase, function() {
		this.modelDescription = modelDescription
	})
}

var CustomModelBase = Class(function() {
	this.modelDescription = {}
	
	this.init = function(idOrValues, parent, propertySchema) {
		if (propertySchema) { this._propertyID = propertySchema.id }
		this._parentItem = parent
		this._oid = unique()
		
		if (typeof idOrValues == 'number') {
			this._createPropertyGetters({})
			this._instantiateWithID(idOrValues)
		} else if (idOrValues != null) {
			this._createPropertyGetters(idOrValues)
			this._createWithValues(idOrValues)
		} else {
			this._createPropertyGetters({})
		}
	}
	
	this.waitForGUID = function(callback) {
		if (typeof callback != 'function') { debugger }
		if (this._guid !== undefined) { callback(this._guid) }
		else if (this._waitingForID) { this._waitingForID.push(callback) }
		else { this._waitingForID = [callback] }
	}
	
	this.getGUID = function(callback) {
		// TODO If no sub property of this model has been observed, then UID will not have been requsted
		// from the server, and waitForGUID won't finish
		this.waitForGUID(callback)
	}

	this._instantiateWithID = function(id) {
		// We know what the GUID is right now
		this._guid = id
	}
	
	this._createWithValues = function(values) {
		// When a model is instantiated with a set of properties, we want
		// to go ahead and create then item server-side right away.
		this._waitForPropertyIDs(values, bind(this, function() {
			this._createInDatabase(values, bind(this, function(newID) {
				this._guid = newID
				each(this._waitingForID, function(fn) { fn(newID) })
				delete this._waitingForID
			}))
		}))
	}
	
	this._createPropertyGetters = function(values) {
		each(this.modelDescription, this, function(propertyDescription, propertyName) {
			var delayedPropertyInstantiator = bind(this, this._instantiateDelayedProperty, propertyName, propertyDescription, values[propertyName])
			defineGetter(this, propertyName, delayedPropertyInstantiator)
		})
	}
	
	this._instantiateDelayedProperty = function(propertyName, propertyDescription, instantiationValue) {
		var propertyType = propertyDescription.type
		delete this[propertyName]
		if (instantiationValue instanceof CustomModelBase || instantiationValue instanceof propertyModels.Base) {
			return this[propertyName] = instantiationValue
		} else {
			return this[propertyName] = propertyModels[propertyType]
				? new propertyModels[propertyType](propertyDescription, this)
				: new fin.orm[propertyType](instantiationValue, this, propertyDescription)
		}
	}
	
	this._waitForPropertyIDs = function(values, callback) {
		var waitingFor = 1
		function tryNow() {
			if (--waitingFor) { return }
			callback()
		}
		each(this.modelDescription, this, function(propertyDescription, propertyName) {
			if (propertyModels[propertyDescription.type]) { return } // it's a value property - no need to wait for an ID
			waitingFor++
			this[propertyName].waitForGUID(tryNow)
		})
		tryNow()
	}
	
	this._createInDatabase = function(values, callback) {
		var filteredValues = {}
		each(this.modelDescription, function(propertyDescription, propertyName) {
			var propertyType = propertyDescription.type
			filteredValues[propertyDescription.id] = propertyModels[propertyType]
				? values[propertyName]
				: values[propertyName]._guid
		})
		fin.create(filteredValues, callback)
	}
})

module.exports.restrictedNames = new CustomModelBase(null)