exports.parseMutationBytes = function(mutationBytes) {
	// The first byte gives length of connection id
	var idLength = mutationBytes[0] - 48,
		mutationString = mutationBytes.toString(),
		originId = mutationString.substr(1, idLength)
		mutationJSON = mutationString.substr(1 + idLength)
	
	return { json: mutationJSON, originId: originId }
}
