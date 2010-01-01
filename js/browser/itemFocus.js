jsio('from common.javascript import Singleton');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');
jsio('import browser.css as css');
jsio('import browser.UIComponent');

css.loadStyles(jsio.__path);

exports = Singleton(browser.UIComponent, function() {
	
	var borderWidth = 7;
	
	this.createContent = function() {
		this._layoutHandler = bind(this, 'layout');
		
		this.addClassName('ItemFocus');
		this._top = dom.create({ parent: this._element, className: 'piece top' });
		this._left = dom.create({ parent: this._element, className: 'piece left' });
		this._bottom = dom.create({ parent: this._element, className: 'piece bottom' });
		this._right = dom.create({ parent: this._element, className: 'piece right' });
	}
	
	this.showAt = function(item, preventLayout) {
		if (this._focusedItem) { this._focusedItem.unsubscribe(this._layoutHandler); }
		this._focusedItem = item;
		this._focusedItem.subscribe('Resize', this._layoutHandler);
		if (!preventLayout) {
			this.getElement(); // to force createContent
			this.layout();
			this.appendTo(document.body);
		}
	}
	
	this.removeFrom = function(item) {
		if (this._focusedItem == item) { 
			dom.remove(this._element);
		}
	}
	
	var focusPadding = 2;
	this.layout = function() {
		if (!this._focusedItem) { return; }
		var dim = dimensions.getDimensions(this._focusedItem.getElement());
		dim.width += focusPadding * 2;
		dim.height += focusPadding * 2;
		dim.left -= focusPadding;
		dim.top -= focusPadding;

		dom.setStyle(this._top, { top: dim.top - borderWidth, left: dim.left - borderWidth, 
			width: dim.width + borderWidth });
		dom.setStyle(this._bottom, { top: dim.top + dim.height, left: dim.left - borderWidth, 
			width: dim.width + borderWidth });
		dom.setStyle(this._left, { top: dim.top, left: dim.left - borderWidth, height: dim.height });
		dom.setStyle(this._right, { top: dim.top - borderWidth, left: dim.left + dim.width, 
			height: dim.height + borderWidth * 2 });
	}
})