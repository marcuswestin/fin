function getXHR() {
	return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
}

exports.get = function(url, callback) {
	var xhr = getXHR();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			callback(xhr.responseText);
		}
	}
	xhr.send();
}

exports.getJSON = function(url, callback) {
	exports.get(url, function(responseText) {
		try {
			var data = eval('(' + responseText + ')');
		} catch(e) {
			if (typeof console != 'undefined' && console.log) { console.log('json eval error', e); }
			return callback({});
		}
		callback(data);
	});
}
