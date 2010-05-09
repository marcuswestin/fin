jsio('from shared.javascript import Singleton')

exports = Class(function() {
	
	this.init = function() {
		this._viewConstructors = {}
	}
	
	this.registerView = function(viewName, viewConstructor) {
		this._viewConstructors[viewName] = viewConstructor
	}
	
	this.createView = function(viewName, jsArgs, templateArgs) {
		var args = jsArgs
		if (templateArgs) { args = args.concat(templateArgs) }
		return new this._viewConstructors[viewName](args, jsArgs, templateArgs)
	}
})

