jsio('from common.javascript import Singleton, strip');
// jsio('import browser.xhr');

jsio('import browser.views.ItemValueView')
jsio('import browser.views.ItemReferenceView')



exports = Singleton(function() {
	
	this._constructors = {
		_itemValueView: browser.views.ItemValueView,
		_itemReferenceView: browser.views.ItemReferenceView
	}
	
	this.getView = function(item, type, args) {
		var view = new this._constructors[type]();
		view.initializeView(item, args);
		return view;
	}
})

