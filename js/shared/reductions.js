// Functions moved from ItemSet for later use with reductions
	// this._initialReductionValues = {
	// 	'sum': 0,
	// 	'count': {} // count occurances of each value - not yet supported
	// }
	// 
	// // conditions == [['name', '=', 'marcus'], ['age', '<', 18], ['age', '>', 15] ...]
	// this.init = function(factory, id, conditions) {
	// 	supr(this, 'init')
	// 	this._reductions = {}
	// 	this._reductionValues = {}
	// }
	
	// this.sum = function(property, callback) { this._reduce('sum', property, callback) } 
	
	// // Called on client
	// this._reduce = function(operation, property, callback) {
	// 	var reductionId = operation + ':' + property
	// 	if (typeof this._reductionValues[reductionId] != 'undefined') { 
	// 		// TODO perhpas we should just push another dependant here?
	// 		throw logger.error("Already reducing", reductionId) 
	// 	}
	// 	this._initializeReduction(reductionId, operation, property)
	// 
	// 	this._dependants.push(bind(this, function() {
	// 		callback(null, this._reductionValues[reductionId]) // TODO what should the mutation be here?
	// 	}))
	// }
	
	// // Called on server
	// this.registerReductionById = function(reductionId) {
	// 	// Check if we are already performing this reduction
	// 	if (typeof this._reductionValues[reductionId] != 'undefined') { return } 
	// 	var data = reductionId.split(':'),
	// 		operation = data[0],
	// 		property = data[1]
	// 	this._initializeReduction(reductionId, operation, property)
	// }
	
	// this._initializeReduction = function(reductionId, operation, property) {
	// 	if (!this._reductions[property]) { this._reductions[property] = [] }
	// 	this._reductions[property].push(operation)
	// 	this._reductionValues[reductionId] = this._initialReductionValues[operation]
	// 	this._factory.registerPropertyReduce(reductionId, this._id, property)
	// }
	
	// this._queueMutation = function(mutation) {
	// 	if (mutation.add) { 
	// 		this._queuedMutation.add = this._queuedMutation.add.concat(mutation.add)
	// 	}
	// 	if (mutation.remove) {
	// 		this._queuedMutation.remove = this._queuedMutation.remove.concat(mutation.remove)
	// 	}
	// 	if (mutation.reduce) {
	// 		this._queuedMutation.reduce = this._queuedMutation.reduce.concat(mutation.reduce)
	// 	}
	// 	this._flushMutations()
	// }
	// this.createDelayedMethod('_flushMutations', function() {
	// 	for (var i=0, reduction; reduction = this._queuedMutation.reduce[i]; i++) {
	// 		this._reductionValues[reduction[0]] = reduction[1]
	// 	}
	// 	
	// 	for (var i=0, callback; callback = this._dependants[i]; i++) {
	// 		callback(this._queuedMutation)
	// 	}
	// 	this._queuedMutation = { add: [], remove: [], reduce: [] }
	// })
	

	// this._updateReductions = function(property, fromValue, toValue) {
	// 	logger.info("Update reductions for", property)
	// 	if (!this._reductions[property] || this._reductions[property].length == 0) { return }
	// 	for (var i=0, operation; operation = this._reductions[property][i]; i++) {
	// 		var id = operation + ':' + property,
	// 			mutation = { _id: this._id, reduce: [] }
	// 		switch (operation) {
	// 			case 'sum':
	// 				if (typeof fromValue == 'undefined') { fromValue = 0 } // item added
	// 				if (typeof toValue == 'undefined') { toValue = 0 } // item removed
	// 				this._reductionValues[id] += (toValue - fromValue)
	// 				break;
	// 			case 'count':
	// 				var counts = this._reductionValues[id]
	// 				// TODO Must publish reduction mutation of old value as well
	// 				if (typeof fromValue != 'undefined') { counts[fromValue] -= 1 } // only if item was not just added
	// 				if (typeof toValue != 'undefined') {
	// 					if (!counts[value]) { counts[value] = 0 }
	// 					counts[value] += 1
	// 				}
	// 				break;
	// 		}
	// 		mutation.reduce.push([id, this._reductionValues[id]])
	// 	}
	// 	logger.info('Mutating item set reductions', mutation)
	// 	this._publish('Mutated', mutation)
	// 	// TODO Maybe there should only be dependants, and no publications
	// 	this._queueMutation(mutation)
	// }
	
	// // An item updated remotelly - this only gets called on the client side
	// this.applyMutation = function(mutation) {
	// 	var block = {
	// 		remove: !!mutation.remove,
	// 		add: !!mutation.add,
	// 		reduce: !!mutation.reduce
	// 	}
	// 	function onStored(operation) {
	// 		block[operation] = false
	// 		if (block.add || block.remove) { return }
	// 		this._queueMutation(mutation)
	// 	}
	// 	if (mutation.remove) { this._store.removeFromSet(this._id, mutation.remove, 
	// 		bind(this, onStored, 'remove')) }
	// 	if (mutation.add) { this._store.addToSet(this._id, mutation.add, 
	// 		bind(this, onStored, 'add')) }
	// 	// TODO Store and block on mutation reductions
	// 	if (mutation.reduce) { onStored.call(this, 'reduce') }
	// }
