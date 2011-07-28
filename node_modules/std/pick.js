/*
	Example usage:
	filter([1,2,0,'',false,null,undefined]) // -> [1,2,0,'',false]
	filter([1,2,3], this, function(val, index) { val == 1 }) // -> [1]
*/
var each = require('./each')

module.exports = function filter(arr, ctx, fn) {
	var result = []
	if (arguments.length == 2) {
		fn = ctx
		ctx = this
	}
	if (!fn) {
		fn = falseOrTruthy
	}

	each(arr, function(value, index) {
		if (!fn.call(ctx, value, index)) { return }
		result.push(value)
	})
	return result
}

function falseOrTruthy(arg) {
	return !!arg || arg === false
}

