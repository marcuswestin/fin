jsio('from common.javascript import Singleton');

jsio('import browser.views.Value')
jsio('import browser.views.Input')
jsio('import browser.views.List')

exports = Singleton(function() {
	
	this.getView = function(items, name, references) {
		var view = new browser.views[name](items, references);
		return view;
	}
})

