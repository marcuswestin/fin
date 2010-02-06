jsio('from common.javascript import Class, bind')
jsio('import browser.editable');
jsio('import browser.UIComponent')

exports = Class(browser.UIComponent, function(supr){
	
	this._domType = 'span';
	
	this.initializeView = function(item, args) {
		this._item = item;
		this._propertyName = args[0];
	}
	
	this.createContent = function() {
		var value = this._item.getProperty(this._propertyName);
		if (value) {
			this.setValue(value);
		} else {
			this.setValue('loading ' + this._propertyName + '...');
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
	
	this.handleSelected = function(listComponent) {
		browser.editable.setValue(this._item.getProperty(this._propertyName));
		browser.editable.showAt(this, bind(this, '_onMutation'), bind(listComponent, 'focus'));
	}
	
	this._onMutation = function(mutation, value) {
		this.setValue(value); // set the value of the element beneath the input early, so that its size updates correctly
		mutation.property = this._propertyName;
		this._item.mutate(mutation);
	}
	
	this._onPropertyUpdated = function(propertyName, newValue) {
		if (propertyName != this._propertyName) { return; }
		this.setValue(newValue);
	}
})