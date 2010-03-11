jsio('from common.javascript import Singleton, strip, forEach')
jsio('import browser.viewFactory')

exports = Singleton(function() {
	
	this._widgetRegex = /\(\([\.\w\s]+?\)\)/g
	this._itemReferenceRegex = /([\w]+)?\.([\.\w]+)/
	this._singleItemName = '__item'
	
	this.applyTemplate = function(templateString, items, singleItem) {
		// replace view template strings with elements we can later extract and replace with views
		var templateElement = document.createElement('span')
		var viewElements = []
		
		if (singleItem) {
			var item = items, items = {}
			items[this._singleItemName] = item
		}
		
		viewMatches = this._findViewsInTemplate(templateString, singleItem)
		for (var i=0, viewMatch; viewMatch = viewMatches[i]; i++) {
			var view = browser.viewFactory.getView(items, viewMatch.name, viewMatch.references)
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
	
	this._findViewsInTemplate = function(template, singleItem) {
		var matches = template.match(this._widgetRegex)
		var views = []
		if (!matches) { return views }
		for (var i=0, match; match = matches[i]; i++) {
			var stripped = strip(match.substring(2, match.length - 2)) // strip (( )) and whitespace
			var args = stripped.split(' ')
			var name = (args.length == 1 ? 'Value' : args.shift())
			
			var references = []
			for (var j=0, arg; arg = args[j]; j++) {
				if (singleItem) {
					references[j] = { item: this._singleItemName, property: arg }
				} else {
					var itemAndPropertyMatches = arg.match(this._itemReferenceRegex)
					references[j] = { item: itemAndPropertyMatches[1], property: itemAndPropertyMatches[2] }
				}
			}
			views.push({ name: name, references: references , string: match })
		}
		return views
	}
})