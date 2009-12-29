var events = {}
if (typeof exports != 'undefined') { exports = events };

;(function() {
	events.add = function(element, eventName, handler, dontIncludeEvent) {
		// Is removeEvent going to work properly when we wrap the handler in another function?
		function normalizeEvent(e) {
			e = e || event;
			if (!e.target) { e.target = e.srcElement; }
			handler(dontIncludeEvent ? null : e);
		}
		
		if (element.addEventListener) {
			element.addEventListener(eventName, normalizeEvent, false);
		} else if (element.attachEvent){
			element.attachEvent("on"+eventName, normalizeEvent);
		}
		return handler;
	}

	events.remove = function(element, eventName, handler) {
		if (!handler) { return; }
		if (element.removeEventListener) {
			element.removeEventListener(eventName, handler, false);
			return true;
		} else if (element.detachEvent) {
			return element.detachEvent("on"+eventName, handler);
		}
	} 
	
	events.cancel = function(e) {
		if (e.preventDefault) { e.preventDefault(); }
		else { e.returnValue = false; }
	}
	
	events.KEY_ENTER = 13;
	events.KEY_BACKSPACE = 8;
	events.KEY_ESCAPE = 27;
})()
