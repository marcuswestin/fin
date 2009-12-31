jsio('from common.javascript import Singleton');

exports = Singleton(function() {
	
	var templatePropsRegex = /\{\{[^\}]+\}\}/g;

	this.init = function() {
		this._compiledTemplates = {};
		this._propertyMatches = {};
	}
	
	this.getTemplateId = function(itemType, viewType) {
		return itemType + '-' + viewType + '-template';
	}
	
	this.getTemplateHTML = function(templateId) {
		if (this._compiledTemplates[templateId]) { return this._compiledTemplates[templateId]; }
		
		var matches = this.getPropertyMatches(templateId);
		var templateHTML = document.getElementById(templateId).innerHTML;
		for (var i=0, match; match = matches[i]; i++) {
			while (templateHTML.match(match._str)) {
				templateHTML = templateHTML.replace(match._str,
					'<span class="' + this.getPlaceholderClassName(match.name) + '"></span>');
			}
		}
		return this._compiledTemplates[templateId] = templateHTML;
	}
	
	this.getPropertyMatches = function(templateId) {
		if (this._propertyMatches[templateId]) { return this._propertyMatches[templateId]; }
		var matches = this._getRawMatches(templateId);
		this._propertyMatches[templateId] = [];
		var templateHTML = document.getElementById(templateId).innerHTML;
		var matches = templateHTML.match(templatePropsRegex);
		for (var i=0, match; match = matches[i]; i++) {
			var parts = match.substring(2, match.length - 2).split(':'); // strip {{ }} and split up name:type
			this._propertyMatches[templateId].push({ name: parts[0], type: parts[1], _str: match });
		}
		return this._propertyMatches[templateId];
	}
	
	this.getPlaceholderClassName = function(propertyName) {
		return 'propertyPlaceholder-' + propertyName;
	}
	
	this._getRawMatches = function(templateId) {
	}
})