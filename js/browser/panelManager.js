jsio('from common.javascript import Singleton, bind, map');

jsio('import common.ItemReference');
jsio('import browser.ItemReferenceView');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.Animation');

jsio('import browser.UIComponent');
jsio('import browser.panels.ItemPanel');


var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Singleton(browser.UIComponent, function(supr) {
	
	this.createContent = function() {
		this.addClassName('PanelManager');
		this._offset = 0;
		this._panelsByItem = {};
		this._panelsByIndex = [];
		this._panelWidth = 300;
		this._panelMargin = 30;
		this._panelAnimationDuration = 650;
		this._panelAnimation = new browser.Animation(bind(this, '_animatePanels'), 
			this._panelAnimationDuration);
		this.__defineSetter__('_focusIndex', function(newFocusIndex){
			if (typeof newFocusIndex != 'number') { debugger; }
			this.__focusIndex = newFocusIndex;
		})
		
		this.__defineGetter__('_focusIndex', function(newFocusIndex){
			return this.__focusIndex;
		})
	}
	
	this.setOffset = function(offset) { this._offset = offset; }
	
	this.showItem = function(item) {
		// debugger;
		if (this._panelsByItem[item]) {
			this.focusPanel(this._panelsByItem[item]);
		} else {
			this._blurFocusedPanel();
			this._focusIndex = this._addPanel(item);
			this.focusPanel(this._panelsByIndex[this._focusIndex]);
		}
	}
	
	this.focus = function() {
		this.focusPanel(this._panelsByIndex[this._focusIndex]);
	}
	
	this.focusPanel = function(panel) {
		if (!panel) { return; }
		this._blurFocusedPanel();
		this._focusIndex = this._getPanelIndex(panel);
		panel.focus();
		this._positionPanels();
		this._publish('PanelFocused', panel);
	}
	
	this._blurFocusedPanel = function() {
		if (!this._panelsByIndex[this._focusIndex]) { return; }
		this._panelsByIndex[this._focusIndex].blur();
		delete this._focusIndex;
	}
	
	this.focusPanelIndex = function(index) {
		if (!this._panelsByIndex[index]) { return; }
		this.focusPanel(this._panelsByIndex[index]);
	}
	
	this.focusLastPanel = function() { this.focusPanelIndex(this._panelsByIndex.length - 1); }
	
	this.focusNextPanel = function() {
		var nextIndex = this._focusIndex + 1
		if (nextIndex == this._panelsByIndex.length) { nextIndex = 0; }
		this.focusPanel(this._panelsByIndex[nextIndex]);
	}
	
	this.focusPreviousPanel = function() {
		var previousIndex = this._focusIndex - 1;
		if (previousIndex < 0) { previousIndex = this._panelsByIndex.length - 1 }
		this.focusPanel(this._panelsByIndex[previousIndex]);
	}
	
	this.hasPanels = function() { return !!this._panelsByIndex.length; }
	
	this.removePanel = function(panel) {
		var panelIndex = this._getPanelIndex(panel);
		this._panelsByIndex.splice(panelIndex, 1);
		delete this._panelsByItem[panel.getItem()];
		dom.remove(panel.getElement());
		if (panelIndex == this._focusIndex) { 
			// panelIndex will now refer to panel on the right of removed panel
			this.focusPanel(this._panelsByIndex[panelIndex]);
		}
		this._positionPanels();
	}
	
	this.layout = function(size) {
		dom.setStyle(this._element, size);
		this._positionPanels();
	}

	this._getPanelIndex = function(panel) {
		for (var i=0; i < this._panelsByIndex.length; i++) {
			if (panel != this._panelsByIndex[i]) { continue; }
			return i;
		}
	}
	
	this._addPanel = function(item) {
		if (this._panelsByItem[item]) { return this._panelsByItem[item]; }
		
		var panel = new browser.panels.ItemPanel(this, item);
		panel.isNew = true;
		var middleIndex = Math.floor(this._panelsByIndex.length / 2);
		var delayShow = this.hasPanels();
		this._panelsByIndex.splice(middleIndex, 0, panel);
		this._panelsByItem[item] = panel;
		if (delayShow) {
			panel.hide();
			setTimeout(bind(panel, 'show'), this._panelAnimationDuration);
		}
		
		return middleIndex;
	}
	
	this._positionPanels = function() {
		if (!this._panelsByIndex.length) { return; }
		var managerSize = dimensions.getDimensions(this._element);

		// debugger;
		var centerPanel = this._panelsByIndex[this._focusIndex];
		var centerPanelOffset = Math.max(this._offset, managerSize.width / 2 - this._panelWidth / 2);
		this._layoutPanel(centerPanel, centerPanelOffset, managerSize, centerPanel.isNew);
		delete centerPanel.isNew;
		
		this._layoutPanels(1, centerPanelOffset + this._panelWidth + this._panelMargin, managerSize);
		this._layoutPanels(-1, centerPanelOffset - this._panelWidth - this._panelMargin, managerSize);
		
		this._panelAnimation.animate();
	}
	
	this._layoutPanels = function(direction, offset, managerSize) {
		// var stackedPanelWidth = 23;
		// var panelLabelWidth = stackedPanelWidth + 4;
		// var remainingWidth = 
		// var stackPanels = false;
		var startIndex = this._focusIndex + direction;
		for (var i = startIndex, panel; panel = this._panelsByIndex[i]; i += direction) {
			this._layoutPanel(panel, offset, managerSize);
			offset += (this._panelWidth + this._panelMargin) * direction;

			// var remainingPanels = numPanels - i - 1;
			// if (offset + panelWidth + panelLabelWidth + (remainingPanels * stackedPanelWidth) > managerSize.width) {
				// stackPanels = true;
			// }
			// if (stackPanels) {
				// var fromRight = remainingPanels * stackedPanelWidth;
				// panel.targetOffset = managerSize.width - panelWidth - panelLabelWidth - fromRight;
			// } else {
			// }
		}
	}
	
	this._layoutPanel = function(panel, targetOffset, managerSize, snapToPosition) {
		panel.prependTo(this._element);
		panel.currentOffset = snapToPosition ? targetOffset : panel.getDimensions().left - managerSize.left;
		panel.targetOffset = targetOffset;
		panel.layout({ width: this._panelWidth, height: managerSize.height });
	}
	
	this._animatePanels = function(n) {
		for (var i=0, panel; panel = this._panelsByIndex[i]; i++) {
			var diff = panel.targetOffset - panel.currentOffset;
			panel.layout({ left: panel.currentOffset + (diff * n) });
		}
	}
})
