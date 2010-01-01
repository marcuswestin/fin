exports.create = function(params) {
	var el = document.createElement(params.type || 'div');
	if (params.className) { el.className = params.className; }
	if (params.html) { el.innerHTML = params.html; }
	if (params.src) { el.src = params.src; }
	if (params.href) { el.href = params.href; }
	if (params.text) { el.appendChild(document.createTextNode(params.text)); }
	if (params.style) { exports.setStyle(el, params.style); }
	if (params.parent) { params.parent.appendChild(el); }
	return el;
}

exports.setStyle = function(el, styles) {
	for (var key in styles) {
		var value = styles[key];
		if (!isNaN(value) && key != 'zIndex') {
			value = value + 'px';
		} else if (key == 'float') {
			key = 'cssFloat';
		}
		el.style[key] = value;
	}
}

exports.getStyle = function(el, styleProp) {
	if (el.currentStyle) {
		return el.currentStyle[styleProp];
	} else if (window.getComputedStyle) {
		return document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
	}
}

exports.remove = function(el) {
	if (!el || !el.parentNode) { return; }
	el.parentNode.removeChild(el);
}

exports.replace = function(targetElement, newElement) {
	var parentNode = targetElement.parentNode;
	parentNode.insertBefore(newElement, targetElement);
	parentNode.removeChild(targetElement);
}