jsio('from common.javascript import Class, bind');
jsio('import browser.UIComponent');
jsio('import browser.css as css');
jsio('import browser.events as events');
jsio('import browser.dimensions as dimensions');
jsio('import browser.dom as dom');

var logger = logging.getLogger('browser.Drawer');

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	var margin = 40;
	var padding = 3;
	var handleWidth = 10;
	var minHeight = 100;
	var width = 100;
	
	this.createContent = function() {
		this.addClassName('Drawer');
		this._element.innerHTML = '<div class="header">unnamed</div>';
		this.resize();
	}
	
	this.resize = function() {
		var size = dimensions.getSize(window);
		var height = Math.max(minHeight, size.height - margin*2);
		dom.setStyle(this._element, { height: height, top: margin, width: width });
		return { width: width, height: height, top: margin };
	}
	
	this.addLabels = function(labels) {
		for (var i=0, label; label = labels[i]; i++) {
			var el = dom.create({ parent: this._element, className: 'label', text: label + 's' });
			events.add(el, 'click', bind(this, 'publish', 'LabelClick', label));
		}
		// item.subscribe('PropertySet', bind(gClient, 'onItemPropertySet', item.getId()));
		// gClient.subscribeToItem(item);
		
	}
})
