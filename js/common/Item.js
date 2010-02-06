jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')

var logger = logging.getLogger(jsio.__path);

exports = Class(Publisher, function(supr) {
	
	this.init = function(id, properties) {
		supr(this, 'init');
		this._id = id;
		this._type = null;
		this._rev = null;
		this._properties = properties || {};
		this._propertySubscriptions = {};
	}
	
	this.mutate = function(mutation) {
		mutation._id = this._id;
		this._publish('Mutating', mutation);
	}
	
	this.applyMutation = function(mutation, silent) {
		logger.log('apply mutation', mutation._id, mutation.property);
		var value = this._applyMutationToValue(mutation, this._properties[mutation.property] || '');
		this._properties[mutation.property] = value;
		if (!silent) {
			logger.log('publish PropertyUpdated', mutation.property, value);
			this._publish('PropertyUpdated', mutation.property, value);
		}
	}
	
	this._applyMutationToValue = function(mutation, value) {
		if (mutation.deletion) {
			var startDelete = mutation.position;
			var endDelete = mutation.position + mutation.deletion;
			value = value.slice(0, startDelete) + value.slice(endDelete);
		}
		if (mutation.addition) {
			value = value.slice(0, mutation.position) + mutation.addition + value.slice(mutation.position);
		}
		return value;
	}
	
	this.getId = function() { return this._id; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	this.getType = function() { return this._type; }

	this.setSnapshot = function(snapshot) {
		this.setType(snapshot.type);
		this._rev = snapshot._rev;
		for (var propertyName in snapshot.properties) {
			var newValue = snapshot.properties[propertyName];
			this._properties[propertyName] = newValue;
			this._publish('PropertyUpdated', propertyName, newValue);
			var propertySubscribers = this._propertySubscriptions[propertyName];
			if (!propertySubscribers) { continue; }
			for (var i=0, callback; callback = propertySubscribers[i]; i++) {
				callback(newValue);
			}
		}
	}
	this.setType = function(type) {
		this._type = type;
	}
	this.subscribeToProperty = function(property, callback) {
		if (!this._propertySubscriptions[property]) { this._propertySubscriptions[property] = []; }
		this._propertySubscriptions[property].push(callback);
	}
	
	this.asObject = function() {
		return { _id: this._id, _rev: this._rev, type: this._type, properties: this._properties };
	}
	
	this.toString = function() {
		return this._id;
	}
})
