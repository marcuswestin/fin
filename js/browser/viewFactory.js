jsio('from common.javascript import Singleton');

// jsio('import browser.views.ItemValueView')
// jsio('import browser.views.ItemReferenceView')

exports = Singleton(function() {
	
	this.getView = function(item, name, args) {
		jsio('import browser.views.' + name + ' as viewConstructor')
		var view = new viewConstructor(item, args);
		return view;
	}
})

