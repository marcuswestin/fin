jsio('import browser.events')

var logger = logging.getLogger(jsio.__path);

var windowResizeCallbacks = [];

function handleResize() {
	if (!windowResizeCallbacks.length) { return; }
	var size = exports.getWindowSize();
	for (var i=0, callback; callback = windowResizeCallbacks[i]; i++) {
		callback(size);
	}
}

browser.events.add(window, 'resize', handleResize);

exports = {
	onWindowResize: function(callback) { 
		callback(exports.getWindowSize());
		windowResizeCallbacks.push(callback);
	},
	
	cancelWindowResize: function(targetCallback) {
		for (var i=0, callback; callback = windowResizeCallbacks[i]; i++) {
			if (callback != targetCallback) { continue; }
			windowResizeCallbacks.splice(i, 1);
			return;
		}
	},
	
	getWindowSize: function() {
		return { width: window.innerWidth, height: window.innerHeight };
	},
	
	fireResize: handleResize
}

