jsio('from common.javascript import Class');
jsio('import common.Publisher');
jsio('import browser.css')

exports = Class(common.Publisher, function(supr) {
	
	this._domType = 'div';
	
	this.getElement = function() {
		if (!this._element) { 
			this._element = document.createElement(this._domType);
			this.createContent();
		}
		return this._element;
	}
	
	this.createContent = function() {} // abstract method
	
	this.addClassName = function(className) { 
		browser.css.addClassName(this.getElement(), className);
	}
	this.removeClassName = function(className) { 
		browser.css.removeClassName(this.getElement(), className);
	}
	this.hasClassName = function(className) {
		return browser.css.hasClassName(this.getElement(), className);
	}
	
	this.show = function() { this.getElement().style.display = 'block'; }
	this.hide = function() { this.getElement().style.display = 'none'; }
	
	this.appendTo = function(element) { element.appendChild(this.getElement()); }
	this.prependTo = function(element) { element.insertBefore(this.getElement(), element.firstChild); }
})
