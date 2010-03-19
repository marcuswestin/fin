jsio('from shared.javascript import Singleton')

exports = Class(function() {
	
	this.init = function() {
		this._viewConstructors = {}
	}
	
	this.registerView = function(viewName, viewConstructor) {
		this._viewConstructors[viewName] = viewConstructor
	}
	
	this.getView = function(viewName, jsArgs, templateArgs) {
		return new this._viewConstructors[viewName](jsArgs, templateArgs || [])
	}
})

