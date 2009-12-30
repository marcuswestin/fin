jsio('from common.javascript import Class, bind');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.css as css');

jsio('import browser.keystrokeManager');
jsio('import browser.ItemView');

jsio('import .Panel');

css.loadStyles(jsio.__path);

exports = Class(Panel, function(supr) {
	
	this.init = function() {
		supr(this, 'init', arguments);
		this._label = this._item;
		this._lineViews = [];
		this._focusIndex = 0;
	}
	
	this.createContent = function() {
		supr(this, 'createContent');
		this.addClassName('ListPanel');
		this._itemList = dom.create({ parent: this._content, className: 'itemList' });
	}
	
	this.addItem = function(item) {
		var lineView = new browser.ItemView(item, item.getType(), 'line');
		lineView.appendTo(this._itemList);
		events.add(lineView.getElement(), 'click', bind(this, '_publish', 'ItemSelected', item), true);
		this._lineViews.push(lineView);
		this._manager.resize();
	}
	
	this.focus = function() {
		supr(this, 'focus');
		this._keystrokeHandle = browser.keystrokeManager.handleKeys({
			'j': bind(this, '_moveFocus', 1),
			'k': bind(this, '_moveFocus', -1),
			'up arrow': bind(this, '_moveFocus', 1),
			'down arrow': bind(this, '_moveFocus', -1),
			'enter': bind(this, function() {
				this._publish('ItemSelected', this._lineViews[this._focusIndex].getItem()) 
			})
		})
	}
	
	this._moveFocus = function(steps) {
		var newFocusIndex = this._focusIndex + steps;
		if (newFocusIndex < 0 || newFocusIndex >= this._lineViews.length) { return; }
		this._lineViews[this._focusIndex].blur();
		this._focusIndex = newFocusIndex;
		this._lineViews[this._focusIndex].focus();
	}	
})