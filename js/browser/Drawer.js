jsio('from common.javascript import Class, bind');

jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');

jsio('import browser.UIComponent');
jsio('import browser.panels.ListPanel');

var logger = logging.getLogger('browser.Drawer');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	var margin = 40;
	var padding = 3;
	var handleWidth = 10;
	var minHeight = 100;
	var width = 100;
	
	this.init = function() {
		supr(this, 'init');
		this._itemClickCallback = bind(gPanelManager, 'showItem');
	}
	
	this.createContent = function() {
		this.addClassName('Drawer');
		this._drawerEl = dom.create({ parent: this._element, className: 'content' })
		this.resize();
	}
	
	this.resize = function() {
		var size = dimensions.getSize(window);
		var height = Math.max(minHeight, size.height - margin*2);
		var panelWidth = 320;
		dom.setStyle(this._drawerEl, { height: height, top: margin, width: width });
		if (this._panel) {
			dom.setStyle(this._panel.getElement(), { height: height, 
				top: margin, width: panelWidth + 2, left: width + 3 });
		}
		return { width: width + panelWidth - 20, height: height, top: margin };
	}
	
	this.addLabels = function(labels) {
		for (var i=0, label; label = labels[i]; i++) {
			var el = dom.create({ type: 'a', href: '#', parent: this._drawerEl, className: 'label', text: label + 's' });
			events.add(el, 'click', bind(this, '_onLabelClick', label));
		}
	}
	
	this._onLabelClick = function(label, e) {
		events.cancel(e);
		if (this._panel && this._panel.getLabel() == label) { return; }
		
		if (this._panel) {
			this._panel.unsubscribe('ItemClick', this._itemClickCallback);
			dom.remove(this._panel.getElement());
		}

		gClient.getItemsForLabel(label, bind(this, '_onLabelItemsReceived'));
		this._panel = new browser.panels.ListPanel(this, label);
		this._element.appendChild(this._panel.getElement());
		this._panel.subscribe('ItemClick', this._itemClickCallback);
		this.resize();
	}
	
	this._onLabelItemsReceived = function(label, items) {
		for (var i=0, item; item = items[i]; i++) { this._panel.addItem(item); }
	}
})
