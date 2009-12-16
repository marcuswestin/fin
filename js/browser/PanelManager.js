jsio('from common.javascript import Class, bind, map');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dom as dom');
jsio('import browser.dimensions as dimensions');
jsio('import browser.PanelSplitView');

var logger = logging.getLogger('browser.PanelManager');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.createContent = function() {
		this.addClassName('PanelManager');
		this._panels = [];
		
		this.createPanelStack();
	}
	
	// The panel stack should be its own class
	this.createPanelStack = function() {
		var table = dom.create({ type: 'table', parent: this._element, className: 'panelStack' });

		this._panelStack = {};
		this._panelStackEl = dom.create({ type: 'tr', parent: table });
	}
	
	this.openLabel = function(label) {
		if (!this._panels[label]) { 
			this._panels[label] = this._createPanel(label);
			gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		}
		if (this._panels[label] == this._currentPanel) { return; }
		if (this._panelStack[label]) {
			dom.remove(this._panelStack[label]);
			delete this._panelStack[label];
		}
		if (this._currentPanel) { this._stackPanel(this._currentPanel); }
		this._centerPanel(this._panels[label]);
		this._currentPanel = this._panels[label];
		this._positionStack();
	}
	
	this._createPanel = function(label) {
		var panel = new browser.PanelSplitView(label);
		this._element.appendChild(panel.getElement());
		panel.showSpinner();
		return panel;
	}
	
	var vMargin = 50;
	var hMargin = 50;
	this._centerPanel = function(panel) {
		panel.show();
		var stackSize = dimensions.getSize(this._panelStackEl);
		var size = dimensions.getSize(this._element);
		panel.resize(size.width - stackSize.width - hMargin*2, size.height - vMargin*2);
	}
	this.position = function(offsetLeft, offsetTop, width, height) {
		dom.setStyle(this._element, { left: offsetLeft, top: offsetTop, width: width, height: height });
		this._positionStack();
		if (this._currentPanel) { this._centerPanel(this._currentPanel); }
	}
	
	
	this._stackPanel = function(panel) {
		panel.hide();
		var characters = (panel.getLabel() + 's').split('');
		var stackEl = dom.create({ type: 'td', parent: this._panelStackEl, 
			className: 'stackedPanel', html: characters.join('<br />') });
		events.add(stackEl, 'click', bind(this, 'openLabel', panel.getLabel()));
		this._panelStack[panel.getLabel()] = stackEl;
	}
	
	this._positionStack = function(height) {
		if (!this._currentPanel) { return; }
		var height = dimensions.getSize(this._currentPanel.getElement()).height;
		dom.setStyle(this._panelStackEl.parentNode, { height: height });
	}
	
	this._onLabelItemsReceived = function(label, items) {
		logger.log('received items for label', label, items.length);
		var panel = this._panels[label];
		map(items, function(item){ panel.addItem(item); })
	}
})
