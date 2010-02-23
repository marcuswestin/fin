jsio('from common.javascript import Class, bind')
jsio('import common.Publisher')
jsio('import common.ItemReference')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(factory, id) {
		supr(this, 'init');
		this._id = id;
		this._factory = factory;
		this._type = null;
		this._rev = null;
		this._properties = {};
		this._propertySubscriptions = {};
	}
	
	this.mutate = function(mutation) {
		mutation._id = this._id;
		logger.log('mutate', mutation._id, mutation);
		this._publish('Mutating', mutation);
	}
	
	this.applyMutation = function(mutation, silent) {
		logger.log('apply mutation', mutation._id, mutation);
		var value = this._properties[mutation.property] || ''
		// Numbers
		// if (mutation.value) {
		// 	value = mutation.value
		// }

		// Strings
		if (mutation.deletion) {
			var startDelete = mutation.position;
			var endDelete = mutation.position + mutation.deletion;
			value = value.slice(0, startDelete) + value.slice(endDelete);
		}
		if (mutation.addition) {
			value = value.slice(0, mutation.position) + mutation.addition + value.slice(mutation.position);
		}
		
		// Lists
		if (typeof mutation.from != 'undefined' && typeof mutation.to != 'undefined') {
			var item = value.splice(mutation.from, 1)[0]
			value.splice(mutation.to, 0, item)
		}
		
		this._properties[mutation.property] = value;
		this._notifySubscribers(mutation.property)
	}
	
	this._notifySubscribers = function(propertyName) {
		var propertySubscribers = this._propertySubscriptions[propertyName]
		if (!propertySubscribers) { return }
		var newValue = this._properties[propertyName]
		for (var i=0, callback; callback = propertySubscribers[i]; i++) {
			callback(newValue)
		}
	}
	
	this.getId = function() { return this._id; }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	this.getType = function() { return this._type; }

	this.setSnapshot = function(snapshot) {
		this.setType(snapshot.type)
		this._rev = snapshot._rev
		for (var propertyName in snapshot.properties) {
			this._properties[propertyName] = snapshot.properties[propertyName]
		}
		for (var propertyName in this._propertySubscriptions) {
			this._notifySubscribers(propertyName)
		}
	}
	this.setType = function(type) {
		this._type = type;
	}
	this._subscribeToProperty = function(property, callback) {
		if (!this._propertySubscriptions[property]) { this._propertySubscriptions[property] = []; }
		this._propertySubscriptions[property].push(callback);
	}
	
	this.addDependant = function(propertyChain, dependantCallback) {
		if (typeof propertyChain == 'string') { propertyChain = propertyChain.split('.') }
		var propertyName = propertyChain.shift()
		if (propertyChain.length == 0) { 
			this._subscribeToProperty(propertyName, dependantCallback)
			dependantCallback(this._properties[propertyName])
			return
		}
		var item = new common.ItemReference(this._factory, this, propertyName)
		item.addDependant(propertyChain, dependantCallback)
	}
	
	this.asObject = function() {
		return { _id: this._id, _rev: this._rev, type: this._type, properties: this._properties };
	}
	
	this.toString = function() {
		return this._id;
	}
})
