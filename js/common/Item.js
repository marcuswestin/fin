jsio('from common.javascript import Class, bind')
jsio('import common.Publisher')
jsio('import common.ItemReference')

exports = Class(common.Publisher, function(supr) {
	
	this.init = function(factory, id) {
		supr(this, 'init')
		this._properties = { _id: id, _rev: null }
		this._factory = factory
		this._store = factory.getStore()
		this._propertySubscriptions = {}
	}
	
	this.setProperty = function(propertyName, propertyValue) {
		this.mutate({ property: propertyName, value: propertyValue })
	}
	
	this.mutate = function(mutation) {
		mutation._id = this.getId()
		logger.log('mutate', mutation._id, mutation)
		this._publish('Mutating', mutation)
	}
	
	this.applyMutation = function(mutation) {
		logger.log('apply mutation', mutation._id, mutation)
		var value = this._properties[mutation.property] || ''
		if (mutation.value) {
			value = mutation.value
		}
		
		// Strings
		if (mutation.deletion) {
			var startDelete = mutation.position
			var endDelete = mutation.position + mutation.deletion
			value = value.slice(0, startDelete) + value.slice(endDelete)
		}
		if (mutation.addition) {
			value = value.slice(0, mutation.position) + mutation.addition + value.slice(mutation.position)
		}
		
		// Lists
		if (typeof mutation.from != 'undefined' && typeof mutation.to != 'undefined') {
			var item = value.splice(mutation.from, 1)[0]
			value.splice(mutation.to, 0, item)
		}
		
		this._properties[mutation.property] = value
		this._notifySubscribers(mutation.property, mutation)
		this._scheduleStore()
	}

	this._scheduleStore = function() {
		if (this._scheduledWrite) { clearTimeout(this._scheduledWrite) }
		this._scheduledWrite = setTimeout(bind(this, function() {
			delete this._scheduledWrite
			logger.log('Store item', this.getId())
			logger.debug('Store item data', this._properties)
			this._store.storeItemData(this._properties, bind(this, '_handleRevision'))
		}), 2000)
	}
	
	this._handleRevision = function(err, response) {
		if (err) { throw err }
		logger.debug('stored item and got new revision', response.id, response.rev)
		this._properties._rev = response.rev
	}
	
	this._notifySubscribers = function(propertyName, mutation) {
		var propertySubscribers = this._propertySubscriptions[propertyName]
		if (!propertySubscribers) { return }
		var newValue = this._properties[propertyName]
		for (var i=0, callback; callback = propertySubscribers[i]; i++) {
			callback(newValue, mutation)
		}
	}
	
	this.getId = function() { return this._properties._id }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	this.getProperties = function() { return this._properties }
	
	this.setSnapshot = function(snapshot, dontNotify) {
		this._snapshotHasLoaded = true
		this._properties = snapshot
		if (dontNotify) { return }
		for (var propertyName in this._propertySubscriptions) {
			this._notifySubscribers(propertyName)
		}
	}
	this._subscribeToProperty = function(property, callback) {
		if (!this._propertySubscriptions[property]) { this._propertySubscriptions[property] = [] }
		this._propertySubscriptions[property].push(callback)
	}
	
	this.addDependant = function(propertyChain, dependantCallback) {
		if (typeof propertyChain == 'string') { propertyChain = propertyChain.split('.') }
		propertyChain = propertyChain.slice(0)
		var propertyName = propertyChain.shift()
		if (propertyChain.length == 0) { 
			this._subscribeToProperty(propertyName, dependantCallback)
			dependantCallback(this._properties[propertyName])
			return
		}
		var item = new common.ItemReference(this._factory, this, propertyName)
		item.addDependant(propertyChain, dependantCallback)
	}
	
	this.getChainedItem = function(propertyChain) {
		if (propertyChain.length == 0) { 
			return this 
		} else {
			return this._factory.getChainedItem(this, propertyChain)
		}
	}
	
	this.toString = function() { return this._properties._id }
})
