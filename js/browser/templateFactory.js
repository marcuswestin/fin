jsio('from common.javascript import Singleton, strip');
jsio('import browser.xhr');

exports = Singleton(function() {
	
	this._widgetRegex = /\(\([\w\s]+\)\)/g;

	this.init = function() {
		this._templateCallbacks = {};
		this._propertyMatches = {};
		this._fmlFragments = {};
		this._fmlTemplates = {};
	}
	
	this.getTemplateHTML = function(itemType, viewType, callback) {
		if (this._fmlTemplates[itemType]) { 
			return callback(this._getCompiledTemplate(itemType, viewType)); 
		} else if (this._templateCallbacks[itemType]) {
			this._templateCallbacks[itemType].push({ callback: callback, viewType: viewType });
		} else {
			this._templateCallbacks[itemType] = [{ callback: callback, viewType: viewType }];
			css.loadStyles(itemType, 'templates', 'fss');
			browser.xhr.get(this._getPath(itemType), bind(this, '_onTemplateFetched', itemType));
		}
	}
	
	this._onTemplateFetched = function(itemType, fml) {
		// until we figure out how to user getElementById instead of getElementsByClassName 
		// in the document fragments, replace id= with class=
		
		fml = fml.replace(/id=".*-template"/g, function(match, index){
			return "class=" + match.substr(3);
		})
		
		fml = this._replaceValuesWithViews(fml);
		fml = this._replaceReferencesWithViews(fml);
		fml = this._replaceListsWithViews(fml);

		this._fmlTemplates[itemType] = fml;
		for (var i=0, pending; pending = this._templateCallbacks[itemType][i]; i++) {
			var template = this._getCompiledTemplate(itemType, pending.viewType);
			pending.callback(template);
		}
		delete this._templateCallbacks[itemType];
	}
	
	this._getCompiledTemplate = function(itemType, viewType) {
		if (!this._fmlFragments[itemType]) { this._createFragment(itemType); }

		var templateId = viewType + '-template';
		var template = this._fmlFragments[itemType].getElementsByClassName(templateId)[0];
		if (!template) {
			return 'Sorry, no template with id ' + templateId + ' exists in ' + this._getPath(itemType);
		}
		return template.innerHTML;
	}
	
	this._createFragment = function(itemType) {
		this._fmlFragments[itemType] = document.createElement('div');
		var matches = this.findViewsInTemplate(itemType, '_all');
		var templateHTML = this._fmlTemplates[itemType];
		for (var i=0, match; match = matches[i]; i++) {
			while (templateHTML.match(match._str)) {
				templateHTML = templateHTML.replace(match._str,
					'<span class="' + this.getViewClassName(match.name) + '"></span>');
			}
		}
		this._fmlFragments[itemType].innerHTML = templateHTML;
	}
	
	this._getTemplateId = function(itemType, viewType) {
		return itemType + '::' + viewType;
	}

	this._replaceValuesWithViews = function(template) {
		var matches = template.match(/\{\{[^\}:]+\}\}/g);
		if (!matches) { return template; }
		for (var i=0, match; match = matches[i]; i++) {
			template = template.replace(match, function(str, proper) {
				str = str.substring(2, str.length - 2);
				var property = str.replace(/\s+/gi, '');
				return '(( _itemValueView ' + property + ' ))';
			})
		}
		return template;
	}
	
	this._replaceReferencesWithViews = function(template) {
		var matches = template.match(/\{\{[^\}]+\}\}/g);
		if (!matches) { return template; }
		for (var i=0, match; match = matches[i]; i++) {
			template = template.replace(match, function(str, proper) {
				str = str.substring(2, str.length - 2);
				var typeAndProperty = str.replace(/\s+/gi, '').split(':');
				return '(( _itemReferenceView ' + typeAndProperty[1] + ' ' + typeAndProperty[0] + ' ))';
			})
		}
		return template;
	}

	this._replaceListsWithViews = function(template) {
		var matches = template.match(/\[\[[^\]]+\]\]/g);
		if (!matches) { return template; }
		for (var i=0, match; match = matches[i]; i++) {
			template = template.replace(match, function(str, proper) {
				str = str.substring(2, str.length - 2);
				var property = str.replace(/\s+/gi, '');
				return '(( _itemListView ' + property + ' ))';
			})
		}
		return template;
	}

	this.findViewsInTemplate = function(itemType, viewType) {
		var templateId = this._getTemplateId(itemType, viewType);
		if (this._propertyMatches[templateId]) { return this._propertyMatches[templateId]; }
		this._propertyMatches[templateId] = [];
		
		// Now match for all the views
		var matches = this._fmlTemplates[itemType].match(this._widgetRegex);
		for (var i=0, match; match = matches[i]; i++) {
			var stripped = strip(match.substring(2, match.length - 2)); // strip (( )) and whitespace
			var args = stripped.split(' ');
			var name = args.shift();
			this._propertyMatches[templateId].push({ name: name, args: args, _str: match });
		}
		return this._propertyMatches[templateId];
	}
	
	this.getViewClassName = function(viewName) {
		return 'finView-' + viewName;
	}
	
	this._getPath = function(itemType){
		return './templates/' + itemType + '.fml';
	}
	
})