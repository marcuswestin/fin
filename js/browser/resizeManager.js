jsio('import browser.events')

var windowResizeCallbacks = [];

browser.events.add(window, 'resize', function() {
	var size = exports.getWindowSize();
	for (var i=0, callback; callback = windowResizeCallbacks[i]; i++) {
		callback(size);
	}
});

exports = {
	onWindowResize: function(callback) { 
		windowResizeCallbacks.push(callback) 
	},
	
	cancelWindowResize: function(targetCallback) {
		for (var i=0, callback; callback = windowResizeCallbacks[i]; i++) {
			if (callback == targetCallback) { continue; }
			windowResizeCallbacks.splice(i, 1);
			return;
		}
	},
	
	getWindowSize: function() {
		return { width: window.innerWidth, height: window.innerHeight };
	}
}

