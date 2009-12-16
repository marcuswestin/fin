jsio('from common.javascript import Class');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	var margin = 40;
	var padding = 3;
	var handleWidth = 10;
	var minHeight = 240;
	var width = 180;
	
	this.createContent = function() {
		this.addClassName('Drawer');
		this._contents = dom.create({ parent: this._element, className: 'contents' });
		
		events.add(window, 'resize', bind(this, 'onResize'));
		this.onResize();
	}
	
	this.onResize = function() {
		var size = dimensions.getSize(window);
		var height = Math.max(minHeight, size.height - margin*2);
		dom.setStyle(this._element, { height: height, top: margin, width: width });
		var contentsHeight = height - padding*2;
		dom.setStyle(this._contents, { height: contentsHeight, width: width - handleWidth, 
			marginTop: (height - contentsHeight) / 2 });
	}
})
