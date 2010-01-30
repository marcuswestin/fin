var test = require('./test');
var sys = require('sys')
var Growl = require('../lib/node-growl/lib/growl').Growl;
var posix = require('posix');

function onSuccess() {
	Growl.notify("All tests passed!")
}

function onError(suiteName) {
	Growl.notify("FaiL! " + suiteName)
}

var runTestTimeout;
function scheduleRunTests() {
	if (runTestTimeout) { clearTimeout(runTestTimeout); }
	runTestTimeout = setTimeout(function() {
		test.runTests(onSuccess, onError)
	}, 100);
}

var fileCode = {}

test.forEachFile('../js', function(path){
	sys.puts('Monitoring changes to ' + path)
	fileCode[path] = posix.cat(path).wait();
	
	var onFileChange = function() {
		var code = posix.cat(path).wait();
		if (code == fileCode[path]) { return; }
		fileCode[path] = code;
		sys.puts('Detected change to ' + path + '. Scheduling tests to run!')
		scheduleRunTests();
	}
	
	process.watchFile(path, onFileChange);
})
