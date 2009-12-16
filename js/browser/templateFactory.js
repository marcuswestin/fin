jsio('from common.javascript import Singleton');

exports = Singleton(function() {
	
	this.getTemplateHTML = function(itemType, viewType) {
		var id = itemType + '-' + viewType + '-template';
		var el = document.getElementById(id);
		return el.innerHTML;
	}
	
})