exports.getSize = function(element) {
	if (element.innerWidth) { // window object
		return { width: element.innerWidth, height: element.innerHeight }
	} else {
		return { width: element.offsetWidth, height: element.offsetHeight };
	}
}

// dom offset code adopted from jQuery JavaScript Library v1.3.2
/*!
 * jQuery JavaScript Library v1.3.2
 * http://jquery.com/
 *
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
 * Revision: 6246
 */
exports.getPosition = function(elem) {
	var win = window;

	if (elem.getBoundingClientRect) {
		var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (win.pageYOffset || docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
		return { top: top, left: left, width: box.right - box.left, height: box.bottom - box.top };

	} else {
		var offset = arguments.callee.offset;
		if (!offset) {
			var body = document.body, container = document.createElement('div'), innerDiv, checkDiv, table, td, rules, prop, bodyMarginTop = body.style.marginTop,
				html = '<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';

			rules = { position: 'absolute', top: 0, left: 0, margin: 0, border: 0, width: '1px', height: '1px', visibility: 'hidden' };
			for (prop in rules) container.style[prop] = rules[prop];

			container.innerHTML = html;
			body.insertBefore(container, body.firstChild);
			innerDiv = container.firstChild, checkDiv = innerDiv.firstChild, td = innerDiv.nextSibling.firstChild.firstChild;

			var offset = {};
			offset.doesNotAddBorder = (checkDiv.offsetTop !== 5);
			offset.doesAddBorderForTableAndCells = (td.offsetTop === 5);

			innerDiv.style.overflow = 'hidden', innerDiv.style.position = 'relative';
			offset.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

			body.style.marginTop = '1px';
			offset.doesNotIncludeMarginInBodyOffset = (body.offsetTop === 0);
			body.style.marginTop = bodyMarginTop;

			body.removeChild(container);
			arguments.callee.offset = offset;
		}

		var height = elem.offsetHeight;
		var width = elem.offsetWidth;

		var offsetParent = elem.offsetParent, prevOffsetParent = elem,
			doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
			body = doc.body, defaultView = doc.defaultView,
			prevComputedStyle = defaultView.getComputedStyle(elem, null),
			top = elem.offsetTop, left = elem.offsetLeft;

		while ((elem = elem.parentNode) && elem !== body && elem !== docElem) {
			computedStyle = defaultView.getComputedStyle(elem, null);
			top -= elem.scrollTop, left -= elem.scrollLeft;
			if (elem === offsetParent) {
				top += elem.offsetTop, left += elem.offsetLeft;
				if (offset.doesNotAddBorder && !(offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.tagName))) {
					top += parseInt(computedStyle.borderTopWidth, 10) || 0;
					left += parseInt(computedStyle.borderLeftWidth, 10) || 0;
				}
				prevOffsetParent = offsetParent;
				offsetParent = elem.offsetParent;
			}
			if (offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible") {
				top += parseInt(computedStyle.borderTopWidth, 10) || 0;
				left += parseInt(computedStyle.borderLeftWidth, 10) || 0;
			}
			prevComputedStyle = computedStyle;
		}

		if (prevComputedStyle.position === "relative" || prevComputedStyle.position === "static") {
			top += body.offsetTop;
			left += body.offsetLeft;
		}

		if (prevComputedStyle.position === "fixed") {
			top  += Math.max(docElem.scrollTop, body.scrollTop);
			left += Math.max(docElem.scrollLeft, body.scrollLeft);
		}

		return { top: top, left: left, width: width, height: height };
	}
}
// end jQuery positioning code