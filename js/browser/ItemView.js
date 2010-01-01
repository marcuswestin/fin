jsio('from common.javascript import Class, bind')
jsio('import common.ItemReference')

jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import browser.editable')
jsio('import browser.templateFactory')
jsio('import browser.UIComponent')
jsio('import browser.ItemValueView')
jsio('import browser.ItemReferenceView')

var logger = logging.getLogger(jsio.__path);
logger.setLevel(0);

exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(item, itemType, viewType) {
		supr(this, 'init');
		this._item = (item instanceof common.ItemReference ? item.getReferencedItem() : item);
		this._itemType = itemType;
		this._viewType = viewType;

		this._valueViews = {};
		this._referenceViews = {};
		this._views = [];
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
	
	this.getViews = function() { return this._views; }
	
	this._createView = function(property, placeholderElement) {
		var view;
		if (property.type) { // the property is an item reference
			var itemReference = new common.ItemReference(this._item, property.name);
			view = new browser.ItemReferenceView(itemReference, property.type);
		} else {
			view = new browser.ItemValueView(this._item, property.name);
			view.subscribe('DoubleClick', bind(this, 'makeEditable', property.name, view));
		}
		dom.replace(placeholderElement, view.getElement());
		this._views.push(view);
	}
	
	this.makeEditable = function(view) {
		var propertyName = view.getPropertyName();
		logger.log('makeEditable', this._item.getId(), this._item.getProperty(propertyName));
		browser.editable.setValue(this._item.getProperty(propertyName) || '');
		browser.editable.showAt(view.getElement(), bind(this, function(mutation, value){
			view.setValue(value); // set the value of the element beneath the input early, so that its size updates correctly
			mutation.property = propertyName;
			this._item.mutate(mutation);
		}));
	}
})

window.__gItemViewClass = exports;// jsio doesn't support circular imports...