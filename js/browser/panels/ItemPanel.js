jsio('from common.javascript import Class, bind');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.ItemView');
jsio('import .Panel');

css.loadStyles(jsio.__path);

exports = Class(Panel, function(supr) {
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ListPanel');
		var itemView = new browser.ItemView(this._item, this._item.getType(), 'panel');
		this._element.appendChild(itemView.getElement());
	}
	
	// this.resize = function(width, height) {
	// 	supr(this, 'resize', arguments);
	// 	dom.setStyle(this._itemList, { width: width - 10, height: height - 10 });
	// }
})