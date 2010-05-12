/************************************
 * Redis key and channel namespaces *
 ************************************/

// The unique ID key is used to consistently increase item id's. Should we use guid's instead?
exports.uniqueIdKey = '__fin_unique_id'
exports.queryRequestChannel = '__fin_query_request_monitor'

// item properties are stored at 		I<item id>@<propName>	e.g. I20@books
// query result sets are stored at		Q<queryJSON>			e.g. Q{\"type\":\"task\"}
// the lock key for a query is at		L<queryJSON>			e.g. L{\"type\":\"task\"}
// channel names for items are			#I<item id>				e.g. #I20
// channel names for queries are		#Q<queryJSON>			e.g. #Q{\"type\":\"task\"}
// channel names for properties are		#P<propName>			e.g. #Pbooks

exports.getPropertyKeyPattern = function(propName) {
	return 'I*@' + propName
}

exports.getQueryLockPattern = function() {
	return 'L*'
}

// Data state keys
exports.getItemPropertyKey = function(itemId, propName) {
	if (!itemId || !propName) { throw "itemId and propName are required for shared.keys.getItemPropertyKey" }
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

exports.getQueryChannel = function(queryJSON) {
	return '#Q' + queryJSON
}

exports.getPropertyChannel = function(propName) {
	return '#P' + propName
}

exports.getChannelInfo = function(channel) {
	return { type: channel[1], id: channel.substr(2) }
}

// Misc
this.getFocusProperty = function(propName) {
	return '_focus_' + propName
}