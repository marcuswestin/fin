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
		this._panels = {};
		this._panelOrder = [];
	}
	
	this.showLabel = function(label) {
		var panel = this._getPanel(label);
		this._element.appendChild(panel.getElement());
		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		this._positionPanels();
	}
	
	this.showItem = function(item) {
		var panel = this._getPanel(item);
		this._element.appendChild(panel.getElement());
		this._positionPanels();
	}
	
	this._getPanel = function(itemOrLabel) {
		if (this._panels[itemOrLabel]) { return this._panels[itemOrLabel]; }
		if (typeof itemOrLabel == 'string') {
			this._panels[itemOrLabel] = new browser.panels.ListPanel(this, itemOrLabel);
		} else {
			this._panels[itemOrLabel] = new browser.panels.ItemPanel(this, itemOrLabel);
		}
		this._panelOrder.unshift(itemOrLabel);
		return this._panels[itemOrLabel];
	}
	
	this._onLabelItemsReceived = function(label, items) {
		logger.log('received items for label', label, items.length);
		var panel = this._getPanel(label);
		map(items, function(item){ panel.addItem(item); })
	}
	
	
	this.position = function(offsetLeft, offsetTop, width, height) {
		dom.setStyle(this._element, { left: offsetLeft, top: offsetTop, width: width, height: height });
		for (var id in this._panels) {
			this._panels[id].position(0, 0, width, height);
		}
		this._positionPanels();
	}
	
	this._positionPanels = function() {
		var size = dimensions.getSize(this._element);
		var numPanels = this._panelOrder.length;
		var margin = 10;
		var panelWidth = Math.floor(size.width / this._panelOrder.length) - numPanels * margin;
		var offset = 0;
		for (var i=0, panelId; panelId = this._panelOrder[i]; i++) {
			this._panels[panelId].position(offset, 0, panelWidth, size.height);
			offset += panelWidth + margin;
		}
	}
})
