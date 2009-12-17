exports.addClassName = function(element, className) {
	if (!(' ' + element.className + ' ').match(' ' + className + ' ')) {
		element.className += className + ' ';
	}
}

exports.removeClassName = function(element, className) {
	className += ' ';
	var current = element.className;
	var index = current.indexOf(className);
	element.className = current.slice(0, index) + current.slice(index + className.length);
}

var base = 'css/';
var loadedStyles = {};
exports.loadStyles = function(path) {
	path = path.split('.').join('/');
	if (loadedStyles[path]) { return; }
	loadedStyles[path] = true;
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = base + path + '.css';
	document.getElementsByTagName('head')[0].appendChild(link);
}