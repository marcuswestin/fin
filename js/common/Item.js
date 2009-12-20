jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

exports = Class(Publisher, function(supr) {
	
	this.init = function(id, properties) {
		supr(this, 'init');
		this._id = id;
		this._type = null;
		this._revision = null;
		this._properties = properties || {};
	}
	
	this.setProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertySet', propertyName, propertyValue);
	}
	
	this.setSnapshot = function(snapshot) {
		this.setType(snapshot.type);
		for (var key in snapshot.properties) {
			this._properties[key] = snapshot.properties[key];
		}
		this.publish('SnapshotSet');
	}
	
	this.updateProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertyUpdated', propertyName, propertyValue);
	}
	
	this.getId = function() { return this._id; }
	this.getType = function() { return this._type; }
	this.getRevision = function() { return this._revision; }
	this.setRevision = function(revision) { this._revision = revision; }
	this.setType = function(type) {
		if (this._type) {
			throw "Trying to set type for item " + this._id + " with type " + this._type + " to " + type;
		}
		this._type = type;
	}
	this.setProperties = function(properties) { this._properties = properties; }
	
	this.getProperties = function() { return this._properties; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	
	this.asObject = function() {
		return { id: this._id, type: this._type, revision: this._revision, properties: this._properties };
	}
})
