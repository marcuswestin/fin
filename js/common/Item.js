module('from common.javascript import Class')
module('import common.Publisher as Publisher')
module('import browser.events as events')

exports = Class(Publisher, function(supr) {
	
	this.init = function(data) {
		supr(this, 'init');
		this._type = data.type;
		this._properties = data.properties;
	}
	
	this.setProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertyChanged', propertyName, propertyValue)
	}	
})
