jsio('from shared.javascript import Class, bind')
jsio('import shared.Publisher')
jsio('import shared.ItemReference')

exports = Class(shared.Publisher, function(supr) {
	
	this.init = function(factory, itemData) {
		supr(this, 'init')
		this._properties = (typeof itemData == 'string') ? { _id : itemData } : itemData
		this._factory = factory
		this._store = factory.getStore()
		this._propertySubscriptions = {}
	}
	
	this.requestFocus = function(editDeniedCallback) {
		this._subscribeToProperty('editing', bind(this, '_onEditing'))
		this._editDeniedCallback = editDeniedCallback

		// TODO would be nice not to have to reference fin here... Should the item factory have the session id?
		this.setProperty('editing', fin.getSessionId())
	}
	
	this.releaseFocus = function() {
		if (this._properties.editing != fin.getSessionId()) { return }
		this.setProperty('editing', '')
	}
	
	this._onEditing = function(mutation, editor) {
		if (!editor || editor == fin.getSessionId()) { return }
		if (!this._editDeniedCallback) { return }
		this._editDeniedCallback()
		delete this._editDeniedCallback
	}
	
	this.setProperty = function(property, value) {
		if (value == this._properties[property]) { return }
		this.mutate({ property: property, value: value })
	}
	
	// Shorthand for applying a local mutation to change an item, either through setProperty or directly
	this.mutate = function(mutation) {
		mutation._id = this.getId()
		this._factory.handleMutation(mutation)
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
		
		if (value == this._properties[mutation.property]) { return false } // no change
		
		this._properties[mutation.property] = value
		this._notifySubscribers(mutation)
		this._scheduleStore()
		return true
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
	
	this._notifySubscribers = function(mutation) {
		var propertyName = mutation.property
		var propertySubscribers = this._propertySubscriptions[propertyName]
		if (!propertySubscribers) { return }
		var newValue = this._properties[propertyName]
		for (var i=0, callback; callback = propertySubscribers[i]; i++) {
			callback(mutation, newValue)
		}
	}
	
	this.getId = function() { return this._properties._id }
	this.getProperty = function(propertyName) { return this._properties[propertyName] }
	this.getData = function() { return this._properties }
	
	this.setSnapshot = function(snapshot, dontNotify) {
		this._snapshotHasLoaded = true
		this._properties = snapshot
		if (dontNotify) { return }
		for (var propertyName in this._propertySubscriptions) {
			this._notifySubscribers({ property: propertyName, value: this._properties[propertyName] })
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
			var value = this._properties[propertyName]
			dependantCallback({ property: propertyName, value: value }, value)
			return
		}
		var item = new shared.ItemReference(this._factory, this, propertyName)
		item.addDependant(propertyChain, dependantCallback)
	}
	
	this.getChainedItem = function(propertyChain) {
		if (propertyChain.length == 0) { 
			return this 
		} else {
			return this._factory.getChainedItem(this, propertyChain)
		}
	}
	
	this.toString = function() { 
		return this._properties._id 
	}
})
