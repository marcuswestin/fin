jsio('from common.javascript import Class, bind')
jsio('import common.itemFactory')
jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import browser.input')
jsio('import browser.templateFactory')
jsio('import browser.UIComponent')

var logger = logging.getLogger('browser.ItemView');
logger.setLevel(0);

var ItemView = exports = Class(browser.UIComponent, function(supr) {
	
	this.init = function(item, itemType, viewType) {
		supr(this, 'init');
		this._item = item;
		this._itemType = itemType;
		this._viewType = viewType;

		this._valueViews = {};
		this._referenceViews = {};
		
		this._holdForSnapshot = {};
		
		this._item.subscribe('SnapshotSet', bind(this, '_onSnapshotSet'));
		this._item.subscribe('PropertyUpdated', bind(this, '_onPropertyUpdated'));
	}
	
	this.createContent = function() {
		this.addClassName('itemViewType-' + this._itemType + ' itemView-' + this._viewType);
		
		var templateId = browser.templateFactory.getTemplateId(this._itemType, this._viewType);
		var templateHTML = browser.templateFactory.getTemplateHTML(templateId);
		var propertyMatches = browser.templateFactory.getPropertyMatches(templateId); 

		this._element.innerHTML = templateHTML;
		for (var i=0, propertyMatch; propertyMatch = propertyMatches[i]; i++) {
			var propertyName = propertyMatch.substring(2, propertyMatch.length - 2);
			var placeholderClassName = 'propertyPlaceholder-' + propertyName;
			var placeholders = this._element.getElementsByClassName(placeholderClassName);
			for (var j=0, placeholder; placeholder = placeholders[j]; j++) {
				this._createView(propertyName, placeholder)
			}
		}
	}
	
	this._createView = function(propertyName, viewElement) {
		var propertyValue = this._item.getProperty(propertyName);
		
		// If snapshot hasn't loaded, we need to create a placeholder in waiting for snapshot. When snapshot loads, we need to determine if it is a reference or a regular value
		// If snapshot has loaded and property is a reference, we need to create a reference item view
		// If snapshot has loaded and property is a regular value, go ahead and render it and hook up events
		
		if (!propertyValue) { // snapshot hasn't loaded
			if (!this._holdForSnapshot[propertyName]) { this._holdForSnapshot[propertyName] = []; }
			this._holdForSnapshot[propertyName].push(viewElement);
			viewElement.innerHTML = 'loading...';
		} else {
			if (propertyValue.type) { // the property is an item reference
				this._createReferenceView(propertyName, propertyValue.id, propertyValue.type, viewElement);
			} else { // the propery is
				this._createValueView(propertyName, propertyValue, viewElement)
			}
		}
	}
	
	this._onSnapshotSet = function() {
		if (!this._holdForSnapshot) { logger.warn("Got snapshot set twice!") }
		for (var propertyName in this._holdForSnapshot) {
			var propertyValue = this._item.getProperty(propertyName);
			if (!propertyValue) { propertyValue = propertyName; }
			for (var i=0, viewElement; viewElement = this._holdForSnapshot[propertyName][i]; i++) {
				if (propertyValue.type) { // the property is an item reference
					this._createReferenceView(propertyValue.id, propertyValue.type, viewElement);
				} else {
					this._createValueView(propertyName, propertyValue, viewElement);
				}
			}
		}
		delete this._holdForSnapshot;
	}
	
	this._createReferenceView = function(propertyName, itemId, itemType, viewElement) {
		if (!this._referenceViews[propertyName]) { this._referenceViews[propertyName] = []; }
		var item = common.itemFactory.getItem(itemId);
		gClient.subscribeToItem(item);
		var referenceView = new ItemView(item, itemType, 'reference');
		viewElement.appendChild(referenceView.getElement());
		this._referenceViews[propertyName] = viewElement;
	}
	
	this._createValueView = function(propertyName, propertyValue, viewElement) {
		if (!this._valueViews[propertyName]) { this._valueViews[propertyName] = []; }
		this._valueViews[propertyName].push(viewElement);
		viewElement.innerHTML = propertyValue;
		this._connectEvents(propertyName, viewElement);
	}
	
	this._updateValueViews = function(propertyName, propertyValue) {
		if (!this._valueViews[propertyName]) { return; }
		for (var i=0, viewElement; viewElement = this._valueViews[propertyName][i]; i++) {
			viewElement.innerHTML = propertyValue;
		}
	}
	
	this._updateReferenceViews = function(propertyName, itemId, itemType) {
		if (!this._referenceViews[propertyName]) { return; }
		for (var i=0, viewElement; viewElement = this._referenceViews[propertyName][i]; i++) {
			viewElement.innerHTML = '';
			this._createReferenceView(propertyName, itemId, itemType, viewElement);
		}
	}
	
	this._onPropertyUpdated = function(propertyName, propertyValue) {
		if (propertyValue.type) {
			this._updateReferenceViews(propertyName, propertyValue.id, propertyValue.type);
		} else {
			this._updateValueViews(propertyName, propertyValue);
		}
	}
	
	this._connectEvents = function(propertyName, el) {
		events.add(el, 'dblclick', bind(this, '_makeEditable', propertyName, el));
	}
	
	this._makeEditable = function(propertyName, el) {
		logger.log('_makeEditable', this._item.getId(), this._item.getProperty(propertyName));
		browser.input.setValue(this._item.getProperty(propertyName));
		browser.input.showAt(el, bind(this, function(mutation, value){
			el.innerHTML = value; // set the value of the element beneath the input early, so that its size updates correctly
			mutation.property = propertyName;
			mutation._id = this._item.getId();
			this._item.mutate(mutation);
		}));
	}
})
