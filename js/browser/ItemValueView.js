jsio('from common.javascript import Class, bind')
jsio('import browser.UIComponent')

exports = Class(browser.UIComponent, function(supr){
	
	this._domType = 'span';
	
	this.init = function(item, propertyName, viewElement) {
		supr(this, 'init');
		this._item = item;
		this._propertyName = propertyName;
		this._viewElement = viewElement;
	}
	
	this.getPropertyName = function() { return this._propertyName; }
	
	this.createContent = function() {
		var value = this._item.getProperty(this._propertyName);
		if (value) {
			this.setValue(value);
		} else {
			this.setValue('loading...');
		}
		this._item.subscribe('PropertyUpdated', bind(this, '_onPropertyUpdated'));
		events.add(this._element, 'dblclick', bind(this, '_publish', 'DoubleClick'));
	}
	
	this.setValue = function(value) {
		value = value || this._propertyName;
		value = value.replace(/\n/g, '<br />');
		value = value.replace(/ $/, '&nbsp;');
		this._element.innerHTML = value;
		this._publish('Resize');
	}
	
	this._onPropertyUpdated = function(propertyName, newValue) {
		if (propertyName != this._propertyName) { return; }
		this.setValue(newValue);
	}
})