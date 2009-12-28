jsio('from common.javascript import Class, bind');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');

jsio('import browser.resizeManager');
jsio('import browser.UIComponent');
jsio('import browser.panels.ListPanel');

var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	var margin = { top: 10, bottom: 40 };
	var padding = 3;
	var handleWidth = 10;
	var minHeight = 100;
	var width = 170;
	
	this.init = function() {
		supr(this, 'init');
		this._itemClickCallback = bind(gPanelManager, 'showItem');
	}
	
	this.createContent = function() {
		this.addClassName('Drawer');
		this._drawerEl = dom.create({ parent: this._element, className: 'labelList' })
		this.resize();
	}
	
	this.focusPanel = function() {
		if (!this._panel) { return; }
		this._panel.focus();
	}
	this.removePanel = function() {
		if (!this._panel) { return; }
		this._panel.unsubscribe('ItemClick', this._itemClickCallback);
		dom.remove(this._panel.getElement());
		this._panel = null;
		this.resize();
	}
	
	this.resize = function() {
		var size = dimensions.getSize(window);
		var height = Math.max(minHeight, size.height - margin.top - margin.bottom);
		var panelWidth = this._panel ? 320 : 0;
		dom.setStyle(this._drawerEl, { height: height, top: margin.top, width: width });
		if (this._panel) {
			this._panel.resize({ width: panelWidth + 2, height: height });
			dom.setStyle(this._panel.getElement(), { top: margin.top, left: width + 3 });
		}
		return { width: width + panelWidth, height: height, top: margin.top };
	}
	
	this.addLabels = function(labels) {
		for (var i=0, label; label = labels[i]; i++) {
			var el = dom.create({ type: 'a', href: '#', parent: this._drawerEl, className: 'label', text: label });
			events.add(el, 'click', bind(this, '_onLabelClick', label));
		}
	}
	
	
	this._onLabelClick = function(label, e) {
		events.cancel(e);
		if (this._panel && this._panel.getLabel() == label) { return; }
		
		this.removePanel();

		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		this._panel = new browser.panels.ListPanel(this, label);
		this._element.appendChild(this._panel.getElement());
		this._panel.subscribe('ItemClick', this._itemClickCallback);
		
		this.focusPanel();
		browser.resizeManager.fireResize()
	}
	
	this._onLabelItemsReceived = function(label, items) {
		for (var i=0, item; item = items[i]; i++) { this._panel.addItem(item); }
	}
})
