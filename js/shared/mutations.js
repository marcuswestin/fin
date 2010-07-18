
var jsonBeginCharCode = '{'.charCodeAt(0)
exports.parseMutationBytes = function(mutationBytes) {
	var mutationJSON,
		originId
	
	// The mutation bytes can be either a pure JSON string in the case of a query mutation,
	// or a JSON string prepended by the ID of the connection that originated the mutation.
	// If the mutation has an origin ID at the beginning, then the first byte will be an
	// integer which gives the number of subsequent bytes taken up by the origin ID.
	
	if (mutationBytes[0] == jsonBeginCharCode) {
		mutationJSON = mutationBytes.toString()
	} else {
		var idLength = mutationBytes[0] - 48,
			mutationString = mutationBytes.toString()
		
		originId = mutationString.substr(1, idLength)
		mutationJSON = mutationString.substr(1 + idLength)
	}
	
	return { json: mutationJSON, originId: originId }
}
