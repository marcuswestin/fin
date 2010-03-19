// From http://blogs.nitobi.com/alexei/wp-content/uploads/2008/01/getcaretselection3.js
// This function will return the caret position in a text field
exports.getPosition = function(oTextarea) {
	var docObj = oTextarea.ownerDocument;
	var result = {start:0, end:0, caret:0};
	
	if (navigator.appVersion.indexOf("MSIE")!=-1) {
		if (oTextarea.tagName.toLowerCase() == "textarea") {
			if (oTextarea.value.charCodeAt(oTextarea.value.length-1) < 14) {
				oTextarea.value=oTextarea.value.replace(/34/g,'')+String.fromCharCode(28);
			}
			var oRng = docObj.selection.createRange();
			var oRng2 = oRng.duplicate();
			oRng2.moveToElementText(oTextarea);
			oRng2.setEndPoint('StartToEnd', oRng);
			result.end = oTextarea.value.length-oRng2.text.length;
			oRng2.setEndPoint('StartToStart', oRng);
			result.start = oTextarea.value.length-oRng2.text.length; 
			result.caret = result.end;
			if (oTextarea.value.substr(oTextarea.value.length-1) == String.fromCharCode(28)) {
				oTextarea.value = oTextarea.value.substr(0, oTextarea.value.length-1);
			}			
		} else {
			var range = docObj.selection.createRange();
			var r2 = range.duplicate();			
			result.start = 0 - r2.moveStart('character', -100000);
			result.end = result.start + range.text.length;	
			result.caret = result.end;
		}			
	} else {
		result.start = oTextarea.selectionStart;
    	result.end = oTextarea.selectionEnd;
		result.caret = result.end;
	}
	if (result.start < 0) {
		 result = {start:0, end:0, caret:0};
	}	
	return result;
}

// from http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
exports.setPosition = function(input, start, end) {
	if (typeof end == 'undefined') { end = start; }
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(start, end);
	} else {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', start);
		range.moveStart('character', end);
		range.select();
	}
}