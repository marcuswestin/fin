module.exports = {
	"Text": PropertyModel,
	"Number": PropertyModel
}

function PropertyModel(value) {
	this._value = value
}

PropertyModel.prototype.observe = function(callback) {
	var info = _getObservationInfo(this)
	fin.observe(info.id, info.chain, function(mutation) {
		callback(mutation.value, mutation.op)
	})
}

var _getObservationInfo = function(propertyModel) {
	var propertyNameChain = []
	
	while(propertyModel._parent) {
		propertyNameChain.push(propertyModel._propertyID)
		propertyModel = propertyModel._parent
	}
	return { id:propertyModel._id, chain:propertyNameChain }
}
