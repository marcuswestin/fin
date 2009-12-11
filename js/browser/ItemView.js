module('from common.javascript import Class, bind')
module('import browser.events')
module('import browser.input')

exports = Class(function(supr) {
	
	this.init = function(item) {
		this._item = item;
		this._propertyViews = {};
		this._item.subscribe('PropertyChanged', bind(this, '_onPropertyUpdated'));
	}
	
	this.getPropertyView = function(propertyName) {
		if (!this._propertyViews[propertyName]) { 
			this._propertyViews[propertyName] = []; 
		}
		var dom = document.createElement('div');
		this._propertyViews[propertyName].push(dom);
		this._connectEvents(propertyName, dom);
		dom.innerHTML = this._item._properties[propertyName] || ''
		return dom;
	}
	
	this._onPropertyUpdated = function(propertyName, propertyValue) {
		var views = this._propertyViews[propertyName];
		for (var i=0, view; view = views[i]; i++) {
			view.innerHTML = propertyValue;
		}
	}
	
	this._connectEvents = function(propertyName, dom) {
		browser.events.add(dom, 'click', bind(this, '_makeEditable', propertyName, dom));
	}
	
	this._makeEditable = function(propertyName, dom) {
		browser.input.setValue(this._item._properties[propertyName]);
		browser.input.showAt(dom, bind(this._item, 'setProperty', propertyName));
	}
})
