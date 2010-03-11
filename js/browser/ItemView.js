jsio('from common.javascript import Class, bind')
jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import browser.templateFactory')
jsio('import browser.UIComponent')
jsio('import browser.views.viewFactory')

// TODO: This code should really be contained inside ItemPanel instead
exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(item, itemType, viewType) {
		supr(this, 'init');

		this._item = item;
		this._itemType = itemType;
		this._viewType = viewType;

		this._valueViews = {};
		this._referenceViews = {};
		this._propertyViews = [];
	}
	
	this.createContent = function() {
		this.addClassName('itemView fml-' + this._itemType + '-item ' + this._viewType + '-view');
		
		browser.templateFactory.getTemplateHTML(this._itemType, this._viewType, bind(this, '_onTemplateHtml'));
	}
	
	// TODO This should move in to templateFactory
	this._onTemplateHtml = function(templateHTML) {
		var templateViews = browser.templateFactory.findViewsInTemplate(this._itemType, this._viewType); 

		this._element.innerHTML = templateHTML;
		for (var i=0, viewProperties; viewProperties = templateViews[i]; i++) {
			var viewClassName = browser.templateFactory.getViewClassName(viewProperties.name);
			var placeholders = this._element.getElementsByClassName(viewClassName);
			for (var j=0, placeholder; placeholder = placeholders[j]; j++) {
				this._createView(viewProperties, placeholder);
			}
		}
		this._publish('Resize');
	}
	
	this.getItem = function() { return this._item; }
	
	this.getPropertyViews = function() { return this._propertyViews; }
	
	this._createView = function(viewProperties, placeholderElement) {
		var view = browser.views.viewFactory.getView(this._item, viewProperties.name, viewProperties.args);
		dom.replace(placeholderElement, view.getElement());
		this._propertyViews.push(view);
	}
})
