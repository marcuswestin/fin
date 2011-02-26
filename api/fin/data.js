var keys = require('./keys'),
	util = require('./util')

module.exports = {
	setEngine: setEngine,
	getListItems: getListItems,
	retrieveStateMutation: retrieveStateMutation,
	createItem: createItem,
	mutateItem: mutateItem
}

/* State
 *******/
var store, pubsub

/* Exposed functions
 *******************/
function setEngine(theEngine) {
	engine = theEngine
	store = engine.getStore()
	pubsub = engine.getPubSub()
}

function getListItems(listKey, from, to, callback) {
	if (!to) { to = -1 } // grab the entire list if no end index is specified
	store.getListItems(listKey, from, to, function(err, items) {
		if (err) { throw 'could not retrieve list range: '+[listKey, from, to, err].join(' ') }
		callback(items)
	})
}

function retrieveStateMutation(key, type, callback) {
	switch(type) {
		case 'BYTES':
			_retrieveBytes(key, function(json) {
				callback({ op: 'set', args: [json] })
			})
			break
		
		case 'SET':
			_retrieveSet(key, function(members) {
				callback({ op: 'sadd', args: members })
			})
			break
			
		default:
			throw 'could not retrieve state mutation of unknown type: '+[type, key].join(' ')
	}
}

function _retrieveSet(key, callback) {
	store.getMembers(key, function(err, members) {
		if (err) { throw 'could not retrieve set members: '+[key, err].join(' ') }
		callback(members)
	})
}

function createItem(itemProperties, origClient, callback) {
	store.increment(keys.uniqueIdKey, function(err, newItemID) {
		if (err) { throw 'could not increment unique item id counter: '+err }
		
		var doCallback = util.blockCallback(
				util.curry(callback, newItemID), { throwErr: true, fireOnce: true })
		
		for (var propName in itemProperties) {
			var value = itemProperties[propName]
				mutation = { id: newItemID, property: propName, op: 'set', args: [value] }
			
			mutateItem(mutation, origClient, doCallback.addBlock())
		}
		
		doCallback.tryNow()
	})
}

console.log("storage TODO: Fix the 9 digit limit on connId")
function mutateItem(mutation, origClient, callback) {
	var key = keys.getItemPropertyKey(mutation.id, mutation.property),
		operation = mutation.op,
		args = Array.prototype.slice.call(mutation.args, 0),
		connId = origClient ? origClient.sessionId : ''
	
	if (connId.length > 9) {
		// TODO Right now we parse the connection ID out of the mutation bytes, and the first digit says how many bytes the ID is.
		// Really, we should use the byte value of the first byte to signify how long the ID is, and panic if it's longer than 255 characters
		connId = connId.substr(0, 9)
	}

	var mutationBuffer = connId.length + connId + JSON.stringify(mutation)
	
	args.unshift(key)
	console.log('Apply and publish mutation', operation, args)
	if (callback) { args.push(callback) }
	store.handleMutation(operation, args)
	
	// TODO clients should subscribe against pattern channels, 
	//	e.g. for item props *:1@type:* and for prop channels *:#type:*
	//	mutations then come with a single publication channel, 
	//	e.g. :1@type:#type: for a mutation that changes the type of item 1
	// var propChannel = keys.getPropertyChannel(propName)
	
	pubsub.publish(key, mutationBuffer)
	// pubsub.publish(propChannel, mutationBuffer)
}

/* Util functions
 ****************/
var _retrieveBytes = function(key, callback) {
	store.getBytes(key, function(err, value) {
		if (err) { log 'could not retrieve BYTES for key: '+[key, err].join(' ') }
		callback(value)
	})
}
