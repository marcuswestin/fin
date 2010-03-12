jsio('from common.javascript import Singleton, strip, forEach')

exports = Class(function() {
	
	this._widgetRegex = /\(\([\.\w\s]+?\)\)/g
	this._itemReferenceRegex = /([\w]+)?\.([\.\w]+)/
	
	this.init = function(viewFactory) {
		this._viewFactory = viewFactory
	}
	
	this.applyTemplate = function(templateString) {
		// replace view template strings with elements we can later extract and replace with views
		var templateElement = document.createElement('span'),
			viewElements = [],
			jsArgs = Array.prototype.slice.call(arguments, 1)
		
		viewMatches = this._findViewsInTemplate(templateString)
		for (var i=0, viewMatch; viewMatch = viewMatches[i]; i++) {
			
			var view = this._viewFactory.getView(viewMatch.viewName, jsArgs, viewMatch.viewArgs)
			viewElements[i] = view.getElement()
			templateString = templateString.replace(viewMatch._stringMatch, '<finPlaceholder></finPlaceholder>')
		}
		
		// replace placeholder elements with views
		templateElement.innerHTML = templateString
		
		var placeholders = Array.prototype.slice.call(templateElement.getElementsByTagName('finPlaceholder'), 0)
		for (var i=0, viewElement; viewElement = viewElements[i]; i++) {
			var parentNode = placeholders[i].parentNode
			parentNode.insertBefore(viewElement, placeholders[i])
			parentNode.removeChild(placeholders[i])
		}
		
		return templateElement
	}
	
	this._findViewsInTemplate = function(template) {
		var matches = template.match(this._widgetRegex)
		var views = []
		if (!matches) { return views }
		for (var i=0, match; match = matches[i]; i++) {
			var viewArgs = strip(match.substring(2, match.length - 2)).split(' ') // strip (( )) and whitespace, split on space
			var viewName = (viewArgs.length == 1 ? 'Value' : viewArgs.shift()) // infer Value view if not specified
			
			views.push({ viewName: viewName, viewArgs: viewArgs, _stringMatch: match })
		}
		return views
	}
})