/*
 * Return a globally unique string.
 */
module.exports = function() {
	return module.exports.__namespace + (++module.exports.__id)
}
module.exports.__id = 0
module.exports.__namespace = '__u'