var assert = jsio.__env.require('assert')

jsio('from common.javascript import strip');

exports.testStrip = function() {
	assert.equal(strip('  this is a test   '), 'this is a test');
	assert.equal(strip(' \t  this is a test   '), 'this is a test');
}
