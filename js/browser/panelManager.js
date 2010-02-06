jsio('from common.javascript import Singleton, bind, map');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');

jsio('import browser.Animation');

jsio('import browser.UIComponent');
jsio('import browser.panels.ItemPanel');

jsio('import browser.itemFocus');

var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Singleton(browser.UIComponent, function(supr) {
	
	this.createContent = function() {
		this.addClassName('PanelManager');
		this._focusIndex = 0;
		this._offset = 0;
		this._panelsByItem = {};
		this._panelsByIndex = [];
		this._panelWidth = 400;
		this._panelMargin = 30;
		this._offset = 0;
		this._panelAnimation = new browser.Animation(bind(this, '_animatePanels'), 1000);
		this._scrollAnimation = new browser.Animation(bind(this, '_animateScroll'), 500);
		
		events.add(this._element, 'scroll', bind(this, '_onScroll'));
	}
	
	this._onScroll = function() {
		browser.itemFocus.layout();
	}
	
	this.showItem = function(item) {
		if (this._panelsByItem[item]) {
			this.focusPanel(this._panelsByItem[item]);
		} else {
			this._blurFocusedPanel();
			this._addPanel(item);
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
		
		var panelElement = panel.getElement();
		this._currentScroll = this._element.scrollLeft;
		if (panelElement.offsetLeft - this._offset < this._currentScroll) {
			// scroll left by panel's width, or all the way to panel if way off screen
			this._targetScroll = Math.min(this._currentScroll - panelElement.offsetWidth, 
				panelElement.offsetLeft - this._offset);
			this._scrollAnimation.animate();
		} else if (panelElement.offsetLeft + panelElement.offsetWidth > this._currentScroll + this._element.offsetWidth) {
			// scroll right by panel's width, or all the way to panel if way off screen
			this._targetScroll = Math.max(this._currentScroll + panelElement.offsetWidth,
				panelElement.offsetLeft - (this._element.offsetWidth - panelElement.offsetWidth) + 40); 
			this._scrollAnimation.animate();
		}
	}
	
	this._animateScroll = function(n) {
		var diff = this._currentScroll - this._targetScroll;
		this._element.scrollLeft = this._currentScroll - diff * n;
	}
	
	this._blurFocusedPanel = function() {
		if (!this._panelsByIndex[this._focusIndex]) { return; }
		this._panelsByIndex[this._focusIndex].blur();
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
			if (panelIndex >= this._panelsByIndex.length) { panelIndex -= 1; }
			this.focusPanel(this._panelsByIndex[panelIndex]);
		}
		this._positionPanels();
	}
	
	this.setOffset = function(offset) { this._offset = offset; }

	this.layout = function(size) {
		dom.setStyle(this._element, size);
		for (var i = 0, panel; panel = this._panelsByIndex[i]; i++) {
			panel.layout({ height: this._element.offsetHeight - 50 });
		}
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
		this._panelsByIndex.splice(this._focusIndex, 0, panel);
		this._panelsByItem[item] = panel;
		this._positionPanels();
	}
	
	this._positionPanels = function() {
		if (!this._panelsByIndex.length) { return; }

		var targetOffset = this._offset;
		for (var i = 0, panel; panel = this._panelsByIndex[i]; i++) {
			panel.prependTo(this._element);
			if (panel.isNew) {
				panel.currentOffset = targetOffset;
			} else {
				panel.getElement().offsetLeft - this._element.offsetLeft
			}
			panel.currentOffset = panel.isNew ? targetOffset : panel.getElement().offsetLeft - this._element.offsetLeft;
			delete panel.isNew;
			panel.targetOffset = targetOffset;
			panel.layout({ width: this._panelWidth, height: this._element.offsetHeight - 50 });
			
			targetOffset += this._panelWidth + this._panelMargin;
		}
		
		this._panelAnimation.animate();
	}
		
	this._animatePanels = function(n) {
		for (var i=0, panel; panel = this._panelsByIndex[i]; i++) {
			var diff = panel.targetOffset - panel.currentOffset;
			panel.layout({ left: panel.currentOffset + (diff * n) });
		}
	}
})
