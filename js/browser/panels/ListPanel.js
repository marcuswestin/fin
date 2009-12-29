jsio('from common.javascript import Class, bind');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.ItemView');
jsio('import .Panel');

css.loadStyles(jsio.__path);

exports = Class(Panel, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);
		this._label = this._item;
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ListPanel');
		this._itemList = dom.create({ parent: this._content, className: 'itemList' });
	}
	
	this.addItem = function(item) {
		var lineView = new browser.ItemView(item, item.getType(), 'line');
		lineView.appendTo(this._itemList);
		events.add(lineView.getElement(), 'click', bind(this, '_publish', 'ItemClick', item), true);
		this._manager.resize();
	}	
})