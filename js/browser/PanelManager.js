jsio('from common.javascript import Class, bind, map');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');
jsio('import browser.panels.ListPanel');
jsio('import browser.panels.ItemPanel');


var logger = logging.getLogger('browser.PanelManager');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.createContent = function() {
		this.addClassName('PanelManager');
		this._panels = [];
	}
	
	this.showLabel = function(label) {
		var panel = this._getPanel(label);
		this._element.appendChild(panel.getElement());
		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
	}
	
	this.showItem = function(item) {
		var panel = this._getPanel(item);
		this._element.appendChild(panel.getElement());
	}
	
	this._getPanel = function(itemOrLabel) {
		if (this._panels[itemOrLabel]) { return this._panels[itemOrLabel]; }
		if (typeof itemOrLabel == 'string') {
			this._panels[itemOrLabel] = new browser.panels.ListPanel(this, itemOrLabel);
		} else {
			this._panels[itemOrLabel] = new browser.panels.ItemPanel(this, itemOrLabel);
		}
		return this._panels[itemOrLabel];
	}
	
	this._onLabelItemsReceived = function(label, items) {
		logger.log('received items for label', label, items.length);
		var panel = this._getPanel(label);
		map(items, function(item){ panel.addItem(item); })
	}
	
	
	this.position = function(offsetLeft, offsetTop, width, height) {
		dom.setStyle(this._element, { left: offsetLeft, top: offsetTop, width: width, height: height });
	}
})
