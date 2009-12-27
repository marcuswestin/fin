jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

var logger = logging.getLogger('common.Item');
logger.setLevel(0);

exports = Class(Publisher, function(supr) {
	
	this.init = function(id, properties) {
		supr(this, 'init');
		this._id = id;
		this._type = null;
		this._rev = null;
		this._properties = properties || {};
	}
	
	this.mutate = function(mutation) {
		this._publish('Mutating', mutation);
	}
	
	this.applyMutation = function(mutation, silent) {
		logger.log('apply mutation', mutation._id, mutation.property);
		var value = this._properties[mutation.property] || '';
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
			this._publish('PropertyUpdated', mutation.property, value);
		}
	}
	
	this.getId = function() { return this._id; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	this.getType = function() { return this._type; }

	this.setSnapshot = function(snapshot) {
		this.setType(snapshot.type);
		this._rev = snapshot._rev;
		for (var key in snapshot.properties) {
			this._properties[key] = snapshot.properties[key];
		}
		this._publish('SnapshotSet');
	}
	this.setType = function(type) {
		if (this._type && this._type != type) { 
			throw new Error("Attempting to set type " + type + "for item that already has type" + this._type); 
		}
		this._type = type;
	}
	
	this.asObject = function() {
		return { _id: this._id, _rev: this._rev, type: this._type, properties: this._properties };
	}
	
	this.toString = function() {
		return this._id;
	}
})
