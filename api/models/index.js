module.exports = {
	process: process,
	_waitForID: _waitForID
}

var CustomModelPrototype = require('./CustomModel'),
	propertyModels = require('./propertyModels'),
	customModels = module.exports

function process(modelDescriptions) {
	for (var modelName in modelDescriptions) {
		_validateModelDescription(modelName, modelDescriptions[modelName])
		_createModelConstructor(modelName, modelDescriptions[modelName])
	}
	
	if (customModels.Global) { customModels.global = new customModels.Global(0) }
	if (customModels.Local) { customModels.local = new customModels.Local(-1) }
}

var _validateModelDescription = function(modelName, properties) {
	var firstLetterCode = modelName.charCodeAt(0),
		propertyIDs = {}
	assert(65 <= firstLetterCode && firstLetterCode <= 90, 'Model names should start with an upper case letter. "'+modelName+'" does not.')
	assert(!customModels[modelName], 'Model "'+modelName+'" already exists')
	assert(!propertyModels[modelName], 'Property model "'+modelName+'" already exists')
	for (propertyName in properties) {
		var property = properties[propertyName],
			firstLetterCode = propertyName.charCodeAt(0),
			valueType = property.type,
			collectionOf = property.of,
			isCollection = (valueType == 'List' || valueType == 'Set')
		if (isCollection) { assert(collectionOf, 'Collections (Sets and Lists) require the "of" descriptor, e.g. { id:1, type:"List" of:"Number" }. '+modelName+'\'s "'+propertyName+'" is a "'+valueType+'" but it does not have one.') }
		if (collectionOf) { assert(isCollection, 'Only collections (Sets and Lists) should have an "of" descriptor. '+modelName+'\'s "'+propertyName+'" has one but should not since it is of type "'+valueType+'".') }
		assert(isCollection == !!collectionOf, 'Only collections (Sets and Lists) ')
		assert(97 <= firstLetterCode && firstLetterCode <= 122, 'Property names should start with a lowercase letter. "'+propertyName+'" does not.')
		assert(typeof property.id == 'number', 'Properties need an id. "'+propertyName+'" does not')
		assert(!CustomModelPrototype[propertyName], 'Certain property names would overwrite important model methods. "'+propertyName+'" on "'+modelName+'" is such a property - pick a different property name.')
		assert(!propertyIDs[property.id], 'Property IDs need to be unique. "'+modelName+'" has two properties with the id '+property.id+'')
		propertyIDs[property.id] = true
	}
}

var _createModelConstructor = function(modelName, modelDescription) {
	var modelConstructor = customModels[modelName] = function(idOrValues) {
		this._constructor = customModels[modelName]
		this._instantiate.call(this, idOrValues)
	}
	var modelPropertiesID = []
	for (var propertyName in modelDescription) {
		modelPropertiesID.push(modelDescription[propertyName].id)
	}
	modelConstructor.prototype = CustomModelPrototype
	modelConstructor.description = modelDescription
}

/* Util
 ******/
function assert(isOK, msg) {
	if (isOK) { return }
	throw new Error(msg)
}

function _waitForID(model, callback) {
	if (model._id !== undefined) { callback(model._id) }
	else if (model._waitingForID) { model._waitingForID.push(callback) }
	else { model._waitingForID = [callback] }
}

/* TODO
 - add on, observe and promise to RootModel
 - have Text and Number extend RootModel with set
 - have Set and List extend RootModel and publish on('add') and on('remove')
 - to implement on/observe/promise, climb the parent models to create the observation chain
 - call fin.create in initializer
 - add fin.transact
*/

// TODO check that each instance property is present in modelProperties when created
// TODO check that instanceProperties fullfill "type" & "required" in modelProperties
// TODO don't require create to be called explicitly for new models - add another params to suppress creation