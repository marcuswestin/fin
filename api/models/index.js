// nothing here yet :)
var models = module.exports = {
	process: process
}

function process(modelDescriptions) {
	for (var modelName in modelDescriptions) {
		_validateModel(modelName, modelDescriptions[modelName])
		_createModel(modelName)
	}
	for (var modelName in modelDescriptions) {
		_createModelProperties(modelName, modelDescriptions[modelName])
	}
}

var _validateModel = function(modelName, properties) {
	
}

var _createModel = function(modelName) {
	
}

var _createModelProperties = function(modelName, properties) {
	
}