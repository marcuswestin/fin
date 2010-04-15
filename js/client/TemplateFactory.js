jsio('from shared.javascript import Singleton, strip, forEach')

exports = Class(function() {
	
	this._widgetRegex = /\(\([\.\w\s]+?\)\)/g
	this._itemReferenceRegex = /([\w]+)?\.([\.\w]+)/
	
	this.init = function(viewFactory) {
		this._viewFactory = viewFactory
		this._views = {}
		this._uniqueId = 0
	}
	
	this.releaseTemplate = function(element) {
		var id = element.finTemplateId,
			views = this._views[element.finTemplateId]
		
		for (var i=0, view; view = views[i]; i++) { view.release() }
	}
	
	this.applyTemplate = function(templateString) {
		// replace view template strings with elements we can later extract and replace with views
		var templateElement = document.createElement('span'),
			jsArgs = Array.prototype.slice.call(arguments, 1),
			templateId = this._uniqueId++,
			views = (this._views[templateId] = [])
		
		templateElement.className = 'fin-Template'
		templateElement.finTemplateId = templateId
		
		viewMatches = this._findViewsInTemplate(templateString)
		for (var i=0, viewMatch; viewMatch = viewMatches[i]; i++) {
			
			var view = this._viewFactory.getView(viewMatch.viewName, jsArgs, viewMatch.viewArgs)
			views[i] = view
			templateString = templateString.replace(viewMatch._stringMatch, '<finPlaceholder></finPlaceholder>')
		}
		
		// replace placeholder elements with views
		templateElement.innerHTML = templateString
		
		var placeholders = Array.prototype.slice.call(templateElement.getElementsByTagName('finPlaceholder'), 0)
		for (var i=0, view; view = views[i]; i++) {
			var parentNode = placeholders[i].parentNode
			parentNode.insertBefore(view.getElement(), placeholders[i])
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