exports.addClassName = function(element, className) {
	if (!element) { return; }
	if (!(' ' + element.className + ' ').match(' ' + className + ' ')) {
		element.className += ' ' + className + ' ';
	}
}

exports.removeClassName = function(element, className) {
	if (!element) { return; }
	className += ' ';
	var current = element.className;
	var index = current.indexOf(className);
	if (index != -1) {
		element.className = current.slice(0, index) + current.slice(index + className.length);
	}
}

exports.hasClassName = function(element, className) {
	return !!element.className.match(' ' + className + ' ');
}

var cssBase = 'css';
var loadedStyles = {};
exports.loadStyles = function(path, base, extension) {
	base = base || cssBase;
	path = path.split('.').join('/');
	if (loadedStyles[path]) { return; }
	loadedStyles[path] = true;
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = base + '/' + path + '.' + (extension || 'css');
	document.getElementsByTagName('head')[0].appendChild(link);
}
