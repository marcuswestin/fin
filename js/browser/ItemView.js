jsio('from common.javascript import Class, bind')
jsio('import browser.events')
jsio('import browser.input')

exports = Class(function(supr) {
	
	this.init = function(item) {
		this._item = item;
		this._propertyViews = {};
		this._item.subscribe('PropertyUpdated', bind(this, '_onPropertyUpdated'));
	}
	
	this.getPropertyView = function(propertyName) {
		if (!this._propertyViews[propertyName]) { 
			this._propertyViews[propertyName] = []; 
		}
		var dom = document.createElement('span');
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
		browser.input.showAt(dom, bind(this, function(value){
			dom.innerHTML = value; // set the value of the dom beneath the input early, so that its size updates correctly
			this._item.setProperty(propertyName, value);
		}));
	}
})
