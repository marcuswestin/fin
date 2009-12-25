jsio('from common.javascript import Class, bind, map');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.Animation');

jsio('import browser.UIComponent');
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
		this._panelAnimation = new browser.Animation(bind(this, '_animatePanels'));
	}
	
	this.showLabel = function(label) {
		var panel = this._addPanel(label);
		this.focusPanel(panel);
		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
	}
	
	this.showItem = function(item) {
		var panel = this._addPanel(item);
		this.focusPanel(panel);
	}
	
	this.focusPanel = function(panel) {
		if (!(panel in this._panels)) { return; }
		// Clicking either of the first two panels should swap them
		if (panel == this._panels[this._panelOrder[1]]) { panel = this._panels[this._panelOrder[0]]; }
		
		var movedPanel = this._extractPanelFromOrder(panel);
		var dockedPanel = this._panelOrder.shift();
		this._panelOrder.unshift(movedPanel);
		if (dockedPanel) { this._panelOrder.unshift(dockedPanel); }
		
		this._positionPanels();
	}
	
	this.removePanel = function(panel) {
		var panelId = this._extractPanelFromOrder(panel);
		delete this._panels[panelId];
		this._element.removeChild(panel.getElement());
		this._positionPanels();
	}
	
	this.position = function(offsetLeft, offsetTop, width, height) {
		dom.setStyle(this._element, { left: offsetLeft, top: offsetTop, width: width, height: height });
		this._positionPanels();
	}

	this._extractPanelFromOrder = function(panel) {
		for (var i=0; i < this._panelOrder.length; i++) {
			if (panel != this._panels[this._panelOrder[i]]) { continue; }
			return this._panelOrder.splice(i, 1)[0];
		}
	}
	
	this._addPanel = function(itemOrLabel) {
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
		var panel = this._addPanel(label);
		map(items, function(item){ panel.addItem(item); })
	}
	
	this._positionPanels = function() {
		var managerSize = dimensions.getDimensions(this._element);
		var panelWidth = this._minPanelWidth;
		var numPanels = this._panelOrder.length;
		var margin = 30;
		var offset = 0;
		var stackedPanelWidth = 23;
		for (var i=0, panelId; panelId = this._panelOrder[i]; i++) {
			var panelEl = this._panels[panelId].getElement();
			this._element.insertBefore(panelEl, this._element.firstChild);
			dom.setStyle(panelEl, { width: panelWidth, height: managerSize.height });
			var remainingPanels = numPanels - i - 1;

			if (offset + panelWidth + margin + (remainingPanels * stackedPanelWidth) > managerSize.width) {
				// doesn't fit - stack it
				var fromRight = remainingPanels * stackedPanelWidth;
				this._panels[panelId]._targetOffset = managerSize.width - panelWidth - fromRight;
			} else {
				// fits
				this._panels[panelId]._targetOffset = offset;
				offset += panelWidth + margin;
			}
			this._panels[panelId]._currentOffset = dimensions.getDimensions(panelEl).left - managerSize.left || 0;
		}
		this._panelAnimation.animate();
	}
	
	this._animatePanels = function(n) {
		for (var i=0, panel; panel = this._panels[this._panelOrder[i]]; i++) {
			var diff = panel._targetOffset - panel._currentOffset;
			dom.setStyle(panel.getElement(), { left: panel._currentOffset + (diff * n) });
		}
	}
})
