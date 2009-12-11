exports.getSize = function(element) {
	if (element.innerWidth) { // window object
		return { width: element.innerWidth, height: element.innerHeight }
	} else {
		return { width: element.offsetWidth, height: element.offsetHeight };
	}
}

exports.getPosition = function(element) {
	var pos = { top: element.offsetTop, left: element.offsetLeft };
	while ((element = element.offsetParent) && typeof element.offsetTop == 'number') {
		pos.top += element.offsetTop;
		pos.left += element.offsetLeft;
	}
	return pos;
}

