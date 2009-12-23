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
		this._minPanelWidth = 300;
	}
	
	this.showLabel = function(label) {
		var panel = this._getPanel(label);
		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		this._positionPanels();
	}
	
	this.showItem = function(item) {
		var panel = this._getPanel(item);
		this._positionPanels();
	}
	
	this._getPanel = function(itemOrLabel) {
		if (this._panels[itemOrLabel]) { return this._panels[itemOrLabel]; }
		if (typeof itemOrLabel == 'string') {
			this._panels[itemOrLabel] = new browser.panels.ListPanel(this, itemOrLabel);
		} else {
			this._panels[itemOrLabel] = new browser.panels.ItemPanel(this, itemOrLabel);
		}
		this._panelOrder.push(itemOrLabel);
		return this._panels[itemOrLabel];
	}
	
	this._onLabelItemsReceived = function(label, items) {
		logger.log('received items for label', label, items.length);
		var panel = this._getPanel(label);
		map(items, function(item){ panel.addItem(item); })
	}
	
	
	this.position = function(offsetLeft, offsetTop, width, height) {
		dom.setStyle(this._element, { left: offsetLeft, top: offsetTop, width: width, height: height });
		this._positionPanels();
	}
	
	this._positionPanels = function() {
		var size = dimensions.getSize(this._element);
		var panelWidth = this._minPanelWidth;
		var numPanels = this._panelOrder.length;
		var margin = 30;
		var offset = 0;
		var stackedPanelWidth = 23;
		for (var i=0, panelId; panelId = this._panelOrder[i]; i++) {
			var panelEL = this._panels[panelId].getElement();
			this._element.insertBefore(panelEL, this._element.firstChild);
			var remainingPanels = numPanels - i - 1;
			if (offset + panelWidth + margin + (remainingPanels * stackedPanelWidth) > size.width) {
				// doesn't fit - stack it
				panelEL.style.left = null;
				dom.setStyle(panelEL, { right: remainingPanels * stackedPanelWidth,
					width: panelWidth, height: size.height });
			} else {
				// fits
				dom.setStyle(panelEL, { left: offset, width: panelWidth, 
					height: size.height });
				offset += panelWidth + margin;
			}
		}
	}
})
