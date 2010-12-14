jsio('from shared.javascript import assert')

/************************************
 * Redis key and channel namespaces *
 ************************************/

// The unique ID key is used to consistently increase item id's. Should we use guid's instead?
exports.uniqueIdKey = '__fin_unique_id'

// item properties are stored at 		I<item id>@<propName>	e.g. I20@books
// channel names for items are			#I<item id>				e.g. #I20
// channel names for properties are		#P<propName>			e.g. #Pbooks

// Data state keys
exports.getItemPropertyKey = function(itemId, propName) {
	assert(propName && typeof itemId != 'undefined', "itemId and propName are required for shared.keys.getItemPropertyKey")
	return 'I' + itemId + '@' + propName
}

exports.getKeyInfo = function(key) {
	var type = key[0],
		parts = key.substr(1).split('@')
	
	return { type: type, id: parseInt(parts[0]), property: parts[1] }
}

exports.getPropertyChannel = function(propName) {
	return '#P' + propName
}

// Misc
this.getFocusProperty = function(propName) {
	return '_focus_' + propName
}