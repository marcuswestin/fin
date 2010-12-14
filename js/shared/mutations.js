exports.parseMutationBytes = function(mutationBytes) {
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
