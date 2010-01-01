jsio('from common.javascript import Class, bind')
jsio('import common.ItemReference')

jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import browser.templateFactory')
jsio('import browser.UIComponent')
jsio('import browser.ItemValueView')
jsio('import browser.ItemReferenceView')

var logger = logging.getLogger(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(item, itemType, viewType) {
		supr(this, 'init');
		this._item = (item instanceof common.ItemReference ? item.getReferencedItem() : item);
		this._itemType = itemType;
		this._viewType = viewType;

		this._valueViews = {};
		this._referenceViews = {};
		this._propertyViews = [];
	}
	
	this.createContent = function() {
		this.addClassName('itemView itemViewType-' + this._itemType + ' itemView-' + this._viewType);
		
		var templateId = browser.templateFactory.getTemplateId(this._itemType, this._viewType);
		var templateHTML = browser.templateFactory.getTemplateHTML(templateId);
		var templateProperties = browser.templateFactory.getPropertyMatches(templateId); 

		this._element.innerHTML = templateHTML;
		for (var i=0, property; property = templateProperties[i]; i++) {
			var placeholderClassName = browser.templateFactory.getPlaceholderClassName(property.name);
			var placeholders = this._element.getElementsByClassName(placeholderClassName);
			for (var j=0, placeholder; placeholder = placeholders[j]; j++) {
				this._createView(property, placeholder);
			}
		}
	}
	
	this.getItem = function() { return this._item; }
	
	this.getPropertyViews = function() { return this._propertyViews; }
	
	this._createView = function(property, placeholderElement) {
		var view;
		if (property.type) { // the property is an item reference
			var itemReference = new common.ItemReference(this._item, property.name);
			view = new browser.ItemReferenceView(itemReference, property.type);
		} else {
			view = new browser.ItemValueView(this._item, property.name);
		}
		dom.replace(placeholderElement, view.getElement());
		this._propertyViews.push(view);
	}
})

window.__gItemViewClass = exports;// jsio doesn't support circular imports...