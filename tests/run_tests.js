var assert = require('assert');
var test = require('./test')
var sys = require('sys');

function onSuccess() {
	sys.puts("All tests passed!")
}

function onError(suiteName) {
	sys.puts("FaiL! " + suiteName)
}

test.runTests(onSuccess, onError);