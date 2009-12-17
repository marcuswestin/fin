jsio('from common.javascript import Class');
jsio('import browser.Panel');
jsio('import browser.ItemView');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.events as events');

css.loadStyles(jsio.__path);

exports = Class(browser.Panel, function(supr) {
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('PanelSplitView');
		this._itemList = dom.create({ type: 'td', parent: this._layout, className: 'itemList' });
		this._divider = dom.create({ type: 'td', parent: this._layout, className: 'divider' })
		this._itemView = dom.create({ type: 'td', parent: this._layout, className: 'itemView' });
	}
	
	var dividerWidth = 2;
	this.resize = function(width, height) {
		supr(this, 'resize', arguments);
		var halfWidth = Math.round(width / 2 - dividerWidth / 2);
		dom.setStyle(this._itemList, { width: halfWidth });
		dom.setStyle(this._divider, { width: dividerWidth });
		dom.setStyle(this._itemView, { width: halfWidth });
	}
	
	this.addItem = function(item) {
		this.hideSpinner();
		var lineView = new browser.ItemView(item, this._label, 'line');
		this._itemList.appendChild(lineView.getElement());
		events.add(lineView.getElement(), 'click', bind(this, 'showItem', item));
	}
	
	this.showItem = function(item, e) {
		events.cancel(e);
		this._itemView.innerHTML = '';
		var halfPanelView = new browser.ItemView(item, this._label, 'halfView');
		this._itemView.appendChild(halfPanelView.getElement());
	}
})