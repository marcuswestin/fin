jsio('from common.javascript import Singleton, strip, forEach')
jsio('import browser.viewFactory')

exports = Singleton(function() {
	
	this._widgetRegex = /\(\([\.\w\s]+?\)\)/g
	// this._listRegex = /\[\[[^\]]+?\]\]/g
	
	this.applyTemplate = function(templateString, item) {
		
		// compile template
		// templateString = this._replaceListsWithViews(templateString)
		
		// replace view template strings with elements we can later extract and replace with views
		var templateElement = document.createElement('span')
		var viewElements = []

		viewMatches = this._findViewsInTemplate(templateString)
		for (var i=0, viewMatch; viewMatch = viewMatches[i]; i++) {
			var view = browser.viewFactory.getView(item, viewMatch.name, viewMatch.args)
			viewElements[i] = view.getElement()
			templateString = templateString.replace(viewMatch.string, '<finPlaceholder viewIndex="'+i+'"></finPlaceholder>')
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
	
	// this._replaceListsWithViews = function(template) {
	// 	var matches = template.match(this._listRegex)
	// 	if (!matches) { return template }
	// 	for (var i=0, match; match = matches[i]; i++) {
	// 		template = template.replace(match, function(str, proper) {
	// 			str = str.substring(2, str.length - 2)
	// 			var property = str.replace(/\s+/gi, '')
	// 			return '(( List ' + property + ' ))'
	// 		})
	// 	}
	// 	return template
	// }

	this._findViewsInTemplate = function(template) {
		var matches = template.match(this._widgetRegex)
		var views = []
		if (!matches) { return views }
		for (var i=0, match; match = matches[i]; i++) {
			var stripped = strip(match.substring(2, match.length - 2)) // strip (( )) and whitespace
			var args = stripped.split(' ')
			if (args.length == 1) {
				name = 'Value'
			} else {
				var name = args.shift()
			}
			views.push({ name: name, args: args , string: match })
		}
		return views
	}
})