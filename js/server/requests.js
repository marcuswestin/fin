var storage = require('./storage'),
	keys = require('../shared/keys'),
	util = require('../shared/util'),
	log = require('./logger').log

module.exports = {
	handleRequest: handleRequest
}

function handleRequest(client, request) {
	log('handleRequest', JSON.stringify(request))
	if (request.request) {
		if (!_requestHandlers[request.request]) { log('unknown request', request) }
		_requestHandlers[request.request](client, request)
	}
}

var _requestHandlers = {
	'observe': _handleObserveRequest,
	'unsubscribe': _handleUnsubscribeRequest,
	'create': _handleCreateRequest,
	'mutate': _handleMutateRequest,
	'extend_list': _handleExtendListRequest
}

function _handleObserveRequest(client, request) {
	var type = request.type,
		key = keys.getItemPropertyKey(request.id, request.property)
	
	log("subscribe to channel", key)
	client.subscriptionStore.subscribe(key, util.curry(_itemMutationChannelHandler, client))
	
	if (request.snapshot != false) {
		// fake an item mutation event
		storage.retrieveStateMutation(key, type, function(mutation) {
			mutation.id = request.id
			mutation.property = request.property
			client.send({ event:'mutation', data:JSON.stringify(mutation) })
		})
	}
}

function _handleUnsubscribeRequest(client, request) {
	var key = keys.getItemPropertyKey(request.id, request.property)
	client.subscriptionStore.unsubscribe(key)
}

function _handleCreateRequest(client, request) {
	storage.createItem(request.data, client, function(itemData) {
		client.send({ response:request._requestId, data:itemData })
	})
}

function _handleMutateRequest(client, request) {
	request.mutation.time = new Date().getTime()
	storage.mutateItem(request.mutation, client)
}

function _handleExtendListRequest(client, request) {
	var key = keys.getItemPropertyKey(request.id, request.property),
		from = request.from,
		to = request.to
	
	storage.getListItems(key, from, to, function(items) {
		client.send({ response:request._requestId, data:items })
	})
}

/* Util
 ******/
log("requests TODO: Fix the 9 digit limit on connId")
var _itemMutationChannelHandler = function(client, key, mutationBytes) {
	var mutationInfo = _parseMutationBytes(mutationBytes)
	if (mutationInfo.originId == client.sessionId.substr(0, 9)) { return }
	client.send({ event:'mutation', data:mutationInfo.json })
}

var _parseMutationBytes = function(mutationBytes) {
	var mutationJSON, originId
	
	// The mutation bytes is a JSON string prepended by the ID of the connection that
	// originated the mutation. The first byte will be an integer which gives the number
	// of subsequent bytes taken up by the origin ID.
	
	var idLength = mutationBytes[0] - 48,
		mutationString = mutationBytes.toString()
	
	originId = mutationString.substr(1, idLength)
	mutationJSON = mutationString.substr(1 + idLength)
	
	return { json: mutationJSON, originId: originId }
}
