jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

exports = Class(Publisher, function(supr) {
	
	this.init = function(id, type, properties) {
		supr(this, 'init');
		this._type = type;
		this._id = id;
		this._properties = properties || {};
	}
	
	this.setProperty = function(propertyName, propertyValue, hasBeenUpdatedOnServer) {
		this._properties[propertyName] = propertyValue;
		if (hasBeenUpdatedOnServer) {
			this.publish('PropertyUpdated', propertyName, propertyValue);
		} else {
			this.publish('PropertySet', propertyName, propertyValue);
		}
	}
	
	this.getId = function() { return this._id; }
	this.getType = function() { return this._type; }
	this.getProperties = function() { return this._properties; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }

	this.setType = function(type) {
		if (this._type) {
			throw "Trying to set type for item " + this._id + " with type " + this._type + " to " + type;
		}
		this._type = type;
	}
})
