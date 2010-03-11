jsio('from common.javascript import Singleton')

exports = Singleton(function() {
	
	this.init = function() {
		this._viewConstructors = {}
	}
	
	this.registerView = function(viewName, viewConstructor) {
		this._viewConstructors[viewName] = viewConstructor
	}
	
	this.getView = function(items, viewName, references) {
		var view = new this._viewConstructors[viewName](items, references)
		return view
	}
})

