/************************************
 * Redis key and channel namespaces *
 ************************************/

// item properties are stored at 		I<item id>@<propName>	e.g. I20@books
// query result sets are stored at		Q<queryJSON>			e.g. Q{\"type\":\"task\"}
// the lock key for a query is at		L<queryJSON>			e.g. L{\"type\":\"task\"}
// channel names for items are			#I<item id>				e.g. #I20
// channel names for queries are		#Q<queryJSON>			e.g. #Q{\"type\":\"task\"}
// channel names for properties are		#P<propName>			e.g. #Pbooks

// Data state keys
exports.getItemPropertyKey = function(itemId, propName) {
	return 'I' + itemId + '@' + propName
}

exports.getQueryKey = function(queryJSON) {
	return 'Q' + queryJSON
}

exports.getQueryLockKey = function(queryJSON) {
	return 'L' + queryJSON
}

exports.getKeyInfo = function(key) {
	var type = key[0],
		parts = key.substr(1).split('@')
	
	return { type: type, id: parts[0], prop: parts[1] }
}

// Data mutation channels
exports.getItemPropertyChannel = function(itemId, property) {
	return '#I' + itemId + ':' + property
}

exports.getQueryChannel = function(query) {
	return '#Q' + JSON.stringify(query)
}

exports.getPropertyChannel = function(propName) {
	return '#P' + propName
}

exports.getChannelInfo = function(channel) {
	return { type: channel[1], id: channel.substr(2) }
}