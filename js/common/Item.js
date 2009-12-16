jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

exports = Class(Publisher, function(supr) {
	
	this.init = function(id) {
		supr(this, 'init');
		this._id = id;
		this._type = null;
		this._properties = {};
	}
	
	this.setProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertySet', propertyName, propertyValue);
	}
	
	this.updateProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertyUpdated', propertyName, propertyValue);
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
