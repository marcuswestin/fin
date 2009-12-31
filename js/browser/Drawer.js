jsio('from common.javascript import Class, bind');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');

jsio('import browser.resizeManager');
jsio('import browser.UIComponent');
jsio('import browser.Label');
jsio('import browser.ItemView');
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
		this._itemViewClickCallback = bind(this, '_onItemViewClick');
		this._labelListPanel = new browser.panels.ListPanel(this, 'Drawer');
	}
	
	this.createContent = function() {
		this.addClassName('Drawer');
		this._labelListPanel.appendTo(this._element);
		this._labelListPanel.addClassName('labelListPanel')
 		this._labelListPanel.subscribe('ItemSelected', bind(this, '_onLabelSelected'));
		this._labelListPanel.focus();
		
		var addLabelLink = dom.create({ parent: this._labelListPanel.getElement(), 
			className: 'addLabelLink', html: '+ add label' });
		events.add(addLabelLink, 'click', gCreateLabelFn);

		this.resize();
	}
	
	this.focusPanel = function() {
		if (!this._labelViewPanel) { return; }
		this.addClassName('labelListOpen');
		this._labelViewPanel.focus();
	}
	this.removePanel = function() {
		if (!this._labelViewPanel) { return; }
		this.removeClassName('labelListOpen');
		this._labelViewPanel.unsubscribe('ItemSelected', this._itemViewClickCallback);
		dom.remove(this._labelViewPanel.getElement());
		this._labelViewPanel = null;
		browser.resizeManager.fireResize();
	}
	
	this.resize = function() {
		var size = dimensions.getSize(window);
		var height = Math.max(minHeight, size.height - margin.top - margin.bottom);
		var panelWidth = this._labelViewPanel ? 320 : 0;
		dom.setStyle(this._labelListPanel.getElement(), { height: height, top: margin.top, width: width });
		if (this._labelViewPanel) {
			this._labelViewPanel.resize({ width: panelWidth + 2, height: height });
			dom.setStyle(this._labelViewPanel.getElement(), { top: margin.top, left: width + 6 });
		}
		return { width: width + panelWidth, height: height, top: margin.top };
	}
	
	this.addLabels = function(labels) {
		for (var i=0, label; label = labels[i]; i++) {
			var item = new browser.Label(label);
			this._labelListPanel.addItem(item);
		}
	}
	
	this._onLabelSelected = function(label) {
		if (this._labelViewPanel && this._labelViewPanel.getLabel() == label) { return; }
		
		this.removePanel();
		
		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		this._labelViewPanel = new browser.panels.ListPanel(this, label);
		this._labelViewPanel.appendTo(this._element);
		this._labelViewPanel.addClassName('labelViewPanel');
		this._labelViewPanel.subscribe('ItemSelected', this._itemViewClickCallback);
		
		this.focusPanel();
		browser.resizeManager.fireResize();
	}
	
	this._onLabelItemsReceived = function(label, items) {
		for (var i=0, item; item = items[i]; i++) { 
			var itemView = new browser.ItemView(item, item.getType(), 'line');
			this._labelViewPanel.addItem(itemView);
		}
	}
	
	this._onItemViewClick = function(itemView) {
		gPanelManager.showItem(itemView.getItem());
	}
})
