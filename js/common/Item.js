jsio('from common.javascript import Class, bind')
jsio('import common.Publisher as Publisher')
jsio('import browser.events as events')

exports = Class(Publisher, function(supr) {
	
	this.init = function(data) {
		supr(this, 'init');
		this._type = data.type;
		this._properties = data.properties;
	}
	
	this.setProperty = function(propertyName, propertyValue) {
		this._properties[propertyName] = propertyValue;
		this.publish('PropertySet', propertyName, propertyValue)
		setTimeout(bind(this, function fakeServerMessage(){ 
			this.publish('PropertyUpdated', propertyName, propertyValue);
		}), 100);
	}
})
