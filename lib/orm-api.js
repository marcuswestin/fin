var fin = require('./client-api'),
	createModelConstructor = require('./client/orm/createModelConstructor'),
	propertyModels = require('./client/orm/propertyModels')

module.exports = fin

fin.orm = {
	process: process
}

function process(modelDescriptions) {
	for (var modelName in modelDescriptions) {
		_validateModelDescription(modelName, modelDescriptions[modelName])
		fin.orm[modelName] = createModelConstructor(modelDescriptions[modelName])
	}
	
	if (fin.orm.Global) { fin.orm.global = new fin.orm.Global(0) }
	if (fin.orm.Local) { fin.orm.local = new fin.orm.Local(-1) }
}

var _validateModelDescription = function(modelName, properties) {
	var firstLetterCode = modelName.charCodeAt(0),
		propertyIDs = {}
	assert(65 <= firstLetterCode && firstLetterCode <= 90, 'Model names should start with an upper case letter. "'+modelName+'" does not.')
	assert(!fin.orm[modelName], 'Model "'+modelName+'" already exists')
	assert(!propertyModels[modelName], 'Property model "'+modelName+'" already exists')
	for (propertyName in properties) {
		var property = properties[propertyName],
			firstLetterCode = propertyName.charCodeAt(0),
			valueType = property.type,
			collectionOf = property.of,
			isCollection = (valueType == 'List' || valueType == 'Set'),
			propertyID = property.id,
			friendlyName = modelName+'.'+propertyName
		if (isCollection) { assert(collectionOf, 'Collections (Sets and Lists) require the "of" descriptor, e.g. { id:1, type:"List" of:"Number" }. "'+friendlyName+'" is a "'+valueType+'" but it does not have one.') }
		if (collectionOf) { assert(isCollection, 'Only collections (Sets and Lists) should have an "of" descriptor. "'+friendlyName+'" has one but should not since it is of type "'+valueType+'".') }
		assert(isCollection == !!collectionOf, 'Only collections (Sets and Lists) ')
		assert(97 <= firstLetterCode && firstLetterCode <= 122, 'Property names should start with a lowercase letter. "'+friendlyName+'" does not.')
		assert(typeof propertyID == 'number' || typeof propertyID == 'string', 'Properties need an id. "'+friendlyName+'" does not have one.')
		assert(typeof propertyID == 'number', 'For better performance property IDs need to be numeric. "'+friendlyName+'" has ID "'+propertyID+'".')
		assert(!createModelConstructor.restrictedNames[propertyName], 'Certain property names would overwrite important model methods. "'+friendlyName+'" is such a property - pick a different property name.')
		assert(!propertyIDs[propertyID], 'Property IDs need to be unique. "'+modelName+'" has two properties with the id '+propertyID+', "'+modelName+'.'+propertyIDs[propertyID]+'" and "'+friendlyName+'"')
		propertyIDs[propertyID] = propertyName
	}
}

/* Util
 ******/
function assert(isOK, msg) {
	if (isOK) { return }
	throw new Error(msg)
}
