jsio('from common.javascript import Class');
jsio('import browser.UIComponent');
jsio('import browser.itemFocus');

exports = Class(browser.UIComponent, function(supr){
	
	this.init = function(label) {
		supr(this, 'init');
		this._label = label;
	}
	
	this.createContent = function() {
		this.addClassName('Label');
		this._element.innerHTML = this._label;
	}
	
	this.toString = function() { return this._label; }
})
