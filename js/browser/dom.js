exports.create = function(params) {
	var el = document.createElement(params.type || 'div');
	if (params.className) { el.className = params.className; }
	if (params.html) { el.innerHTML = params.html; }
	if (params.src) { el.src = params.src; }
	if (params.text) { el.appendChild(document.createTextNode(params.text)); }
	if (params.style) { exports.setStyle(el, params.style); }
	if (params.parent) { params.parent.appendChild(el); }
	return el;
}

exports.setStyle = function(el, styles) {
	for (var key in styles) {
		var value = styles[key];
		el.style[key] = value + (!isNaN(value) ? value + 'px' : '');
	}
}