jsio('from common.javascript import Class, bind, map');

jsio('import common.ItemReference')
jsio('import browser.ItemReferenceView')

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.Animation');

jsio('import browser.UIComponent');
jsio('import browser.panels.ItemPanel');


var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.createContent = function() {
		this.addClassName('PanelManager');
		this._offset = 0;
		this._panels = {};
		this._panelOrder = [];
		this._minPanelWidth = 300;
		this._panelAnimationDuration = 850;
		this._panelAnimation = new browser.Animation(bind(this, '_animatePanels'), 
			this._panelAnimationDuration);
	}
	
	this.setOffset = function(offset) { this._offset = offset; }
	
	this.showItem = function(item) {
		var panel = this._addPanel(item);
		this.focusPanel(panel);
	}
	
	this.focusPanel = function(panel) {
		if (!(panel in this._panels)) { return; }
		
		if (this._focusedPanel) { this._focusedPanel.blur(); }
		this._focusedPanel = panel;
		this._focusedPanel.focus();
		
		var movedPanel = this._extractPanelFromOrder(panel);
		this._panelOrder.unshift(movedPanel);
		
		this._positionPanels();
	}
	
	this.removePanel = function(panel) {
		var panelId = this._extractPanelFromOrder(panel);
		delete this._panels[panelId];
		this._element.removeChild(panel.getElement());
		if (panel == this._focusedPanel) { this.focusPanel(this._panels[this._panelOrder[0]]); }
		this._positionPanels();
	}
	
	this.layout = function(size) {
		dom.setStyle(this._element, size);
		this._positionPanels();
	}

	this._extractPanelFromOrder = function(panel) {
		for (var i=0; i < this._panelOrder.length; i++) {
			if (panel != this._panels[this._panelOrder[i]]) { continue; }
			return this._panelOrder.splice(i, 1)[0];
		}
	}
	
	this._addPanel = function(item) {
		if (this._panels[item]) { return this._panels[item]; }
		this._panels[item] = new browser.panels.ItemPanel(this, item);
		this._panelOrder.push(item);
		return this._panels[item];
	}
	
	this._positionPanels = function() {
		var managerSize = dimensions.getDimensions(this._element);
		var panelWidth = this._minPanelWidth;
		var numPanels = this._panelOrder.length;
		var margin = 30;
		var offset = this._offset;
		var stackedPanelWidth = 23;
		var stackPanels = false;
		var panelLabelWidth = stackedPanelWidth + 4;
		for (var i=0, panel; panel = this._panels[this._panelOrder[i]]; i++) {
			panel.prependTo(this._element);
			
			panel.layout({ width: panelWidth, height: managerSize.height });
			var remainingPanels = numPanels - i - 1;
			
			if (offset + panelWidth + panelLabelWidth + (remainingPanels * stackedPanelWidth) > managerSize.width) {
				stackPanels = true;
			}
			if (stackPanels) {
				var fromRight = remainingPanels * stackedPanelWidth;
				panel._targetOffset = managerSize.width - panelWidth - panelLabelWidth - fromRight;
			} else {
				panel._targetOffset = offset;
				offset += panelWidth + margin;
			}
			panel._currentOffset = panel.getDimensions().left - managerSize.left || 0;
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
