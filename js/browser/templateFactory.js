jsio('from common.javascript import Singleton');

var templatePropsRegex = /\{\{[^\}]+\}\}/g;

exports = Singleton(function() {
	
	this.init = function() {
		this._compiledTemplates = {};
		this._propertyMatches = {};
	}
	
	this.getTemplateId = function(itemType, viewType) {
		return itemType + '-' + viewType + '-template';
	}
	
	this.getTemplateHTML = function(templateId) {
		if (this._compiledTemplates[templateId]) { return this._compiledTemplates[templateId]; }
		
		var templateHTML = document.getElementById(templateId).innerHTML;
		var propertyMatches = this.getPropertyMatches(templateId);
		for (var i=0, propertyMatch; propertyMatch = propertyMatches[i]; i++) {
			var propertyName = propertyMatch.substring(2, propertyMatch.length - 2);
			while (templateHTML.match(propertyMatch)) {
				templateHTML = templateHTML.replace(propertyMatch, 
					'<span class="propertyPlaceholder-' + propertyName + '"></span>');
			}
		}
		return this._compiledTemplates[templateId] = templateHTML;
	}
	
	this.getPropertyMatches = function(templateId) {
		if (this._propertyMatches[templateId]) { return this._propertyMatches[templateId]; }
		var templateHTML = document.getElementById(templateId).innerHTML;
		return this._propertyMatches[templateId] = templateHTML.match(templatePropsRegex);
	}
})