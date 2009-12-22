jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

var logger = logging.getLogger('common.Item');
logger.setLevel(0);

exports = Class(Publisher, function(supr) {
	
	this.init = function(id, properties) {
		supr(this, 'init');
		this._id = id;
		this._type = null;
		this._revision = null;
		this._properties = properties || {};
	}
	
	this.mutate = function(mutation) {
		this.publish('Mutating', mutation);
	}
	
	this.applyMutation = function(mutation, silent) {
		logger.log('apply mutation', mutation.id, mutation.property);
		var value = this._properties[mutation.property];
		if (mutation.deletion) {
			var startDelete = mutation.position;
			var endDelete = mutation.position + mutation.deletion;
			value = value.slice(0, startDelete) + value.slice(endDelete);
		}
		if (mutation.addition) {
			value = value.slice(0, mutation.position) + mutation.addition + value.slice(mutation.position);
		}
		this._properties[mutation.property] = value;
		if (!silent) {
			logger.log('publish PropertyUpdated', mutation.property, value);
			this.publish('PropertyUpdated', mutation.property, value);
		}
	}
	
	this.getId = function() { return this._id; }
	this.getType = function() { return this._type; }
	this.getRevision = function() { return this._revision; }
	this.getProperties = function() { return this._properties; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }

	this.setRevision = function(revision) { this._revision = revision; }
	this.setType = function(type) {
		if (this._type) {
			throw "Trying to set type for item " + this._id + " with type " + this._type + " to " + type;
		}
		this._type = type;
	}
	this.setProperties = function(properties) { this._properties = properties; }
	this.setSnapshot = function(snapshot) {
		this.setType(snapshot.type);
		for (var key in snapshot.properties) {
			this._properties[key] = snapshot.properties[key];
		}
		this.publish('SnapshotSet');
	}
	
	this.asObject = function() {
		return { id: this._id, type: this._type, revision: this._revision, properties: this._properties };
	}
	this.asDatabaseObject = function() {
		var properties = this._properties;
		properties._id = this._id;
		properties._rev = this._revision;
		properties.type = this._type;
		return properties;
	}
})
