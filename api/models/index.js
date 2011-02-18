var customModels = module.exports = {
	process: process
}

var CustomModelPrototype = require('./CustomModel')

function process(modelDescriptions) {
	for (var modelName in modelDescriptions) {
		_validateModelDescription(modelName, modelDescriptions[modelName])
		_createModelConstructor(modelName, modelDescriptions[modelName])
	}
}

var _validateModelDescription = function(modelName, properties) {
	var firstLetterCode = modelName.charCodeAt(0)
	assert(65 <= firstLetterCode && firstLetterCode <= 90, 'Model names should start with an upper case letter. "'+modelName+'" does not.')
	assert(!customModels[modelName], 'Model "'+modelName+'" already exists')
	assert(!propertyModels[modelName], 'Property model "'+modelName+'" already exists')
	var propertyIDs = {}
	for (propertyName in properties) {
		firstLetterCode = propertyName.charCodeAt(0)
		var property = properties[propertyName]
		assert(97 <= firstLetterCode && firstLetterCode <= 122, 'Property names should start with a lowercase letter. "'+propertyName+'" does not.')
		assert(typeof property.id == 'number', 'Properties need an id. "'+propertyName+'" does not')
		assert(!propertyIDs[property.id], 'Property IDs need to be unique. "'+modelName+'" has two properties with the id '+property.id+'')
		assert(!CustomModelPrototype[propertyName], 'Certain property names would overwrite important model methods. "'+propertyName+'" on "'+modelName+'" is such a property - pick a different property name.')
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

// UTILS

function assert(isOK, msg) {
	if (isOK) { return }
	throw new Error(msg)
}

var PropertyModel = function(value) {
	this._value = value
}

var propertyModels = {
	"Text": PropertyModel,
	"Number": PropertyModel
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
