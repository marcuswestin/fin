var curry = require('./curry'),
	map = require('./map'),
	each = require('./each'),
	json = require('./json')

module.exports = {
	request: request,
	get: curry(request, 'get'),
	post: curry(request, 'post'),
	jsonGet: curry(sendJSON, 'get'),
	jsonPost: curry(sendJSON, 'post')
}

var XHR = window.XMLHttpRequest || function() { return new ActiveXObject("Msxml2.XMLHTTP"); }

function request(method, url, params, callback, headers, opts) {
	var xhr = new XHR()
	method = method.toUpperCase()
	headers = headers || {}
	opts = opts || {}
	xhr.onreadystatechange = function() {
		var err, result
		try {
			if (xhr.readyState != 4) { return }
			if (xhr.status != 200) { return callback(new Error(xhr.status)) }
			result = (opts.json ? json.parse(xhr.responseText) : xhr.responseText)
			if (xhr.getResponseHeader('Content-Type') == 'application/json') { result = json.parse(result) }
		} catch(e) {
			err = e
		}
		if (err || typeof result != undefined) {
			_abortXHR(xhr)
			callback(err, result)
		}
	}

	var data = null

	if (method == 'GET') {
		var encode = (opts.encode !== false),
		queryArr = map(params, function(value, key) { return (encode ? encodeURIComponent(key) : key) + '=' + (encode ? encodeURIComponent(value) : value) })
			url += (url.indexOf('?') == -1 && queryArr.length ? '?' : '') + queryArr.join('&')
	} else if (method == 'POST') {
		data = json.stringify(params)
	}
	xhr.open(method, url, true)
	if (method == 'POST') {
		if (!headers['Content-Type']) { headers['Content-Type'] = "application/x-www-form-urlencoded" }
		each(headers, function(val, key) { xhr.setRequestHeader(key, val) })
	}
	xhr.send(data)
}

function sendJSON(method, url, params, callback) {
	return request(method, url, params, callback, { 'Content-Type':'application/json' }, { json:true })
}

function _abortXHR(xhr) {
	try {
		if('onload' in xhr) {
			xhr.onload = xhr.onerror = xhr.ontimeout = null;
		} else if('onreadystatechange' in xhr) {
			xhr.onreadystatechange = null;
		}
		if(xhr.abort) { xhr.abort(); }
	} catch(e) {}
}
