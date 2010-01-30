var posix = require('posix');
var sys = require('sys')

require('../lib/js.io/packages/jsio');

jsio.path.browser = '../js/'
jsio.path.common = '../js/'
jsio.path.server = '../js/'

exports.forEachFile = function(dir, callback) {
	var entries = posix.readdir(dir).wait();
	for (var i=0, entry; entry = entries[i]; i++) {
		var path = dir + '/' + entry;
		if (posix.stat(path).wait().isDirectory()) {
			exports.forEachFile(path, callback);
		} else {
			callback(path)
		}
	}
}

exports.runTests = function(onSuccess, onFailure) {
	var failure = false;
	jsio.modules = [];
	exports.forEachFile('.', function(path){
		var suiteName = path.split('.')[1].replace(/\//g, '.');
		if (suiteName.split('.').length < 3) { return; } // don't run files in root test directory
		sys.print('Running suite:  ' + suiteName + "\n");
		try {
			jsio('import ' + suiteName + ' as testSuite')
		} catch(e) {
			failure = true;
			onFailure('Import error: ' + suiteName);
			return;
		}
		for (var testName in testSuite) {
			if (!testName.match(/^test/)) { continue; }
			var testFail = false;
			try {
				testSuite[testName]();
			} catch(e) {
				testFail = failure = true;
				onFailure('Test error: ' + suiteName + ' ' + testName);
			}
			if (!testFail) {
				sys.print('\tpassed: ' + testName + "\n");
			}
		}
	})
	if (!failure) {
		onSuccess()
	}
}
