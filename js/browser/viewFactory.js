jsio('from common.javascript import Singleton');

// jsio('import browser.views.ItemValueView')
// jsio('import browser.views.ItemReferenceView')

exports = Singleton(function() {
	
	this.getView = function(items, name, references) {
		jsio('import browser.views.' + name + ' as viewConstructor')
		var view = new viewConstructor(items, references);
		return view;
	}
})

