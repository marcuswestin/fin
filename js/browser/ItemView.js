jsio('from common.javascript import Class, bind')
jsio('import common.itemFactory')
jsio('import browser.events as events')
jsio('import browser.dom as dom')
jsio('import browser.input')
jsio('import browser.templateFactory')

var logger = logging.getLogger('browser.ItemView');
logger.setLevel(0);

var templatePropsRegex = /\{\{[^\}]+\}\}/g;

var ItemView = exports = Class(function(supr) {
	
	this.init = function(item) {
		this._item = item;
		this._propertyViews = {};
		this._snapshotLoaded = false;
		this._viewsPendingSnapshot = [];
		this._item.subscribe('PropertyUpdated', bind(this, '_onPropertyUpdated'));
	}
	
	this.getPropertyView = function(propertyName) {
		if (!this._propertyViews[propertyName]) { 
			this._propertyViews[propertyName] = []; 
		}
		var el = dom.create({ type: 'a', className: 'propertyView', href: '#' });
		this._propertyViews[propertyName].push(el);
		this._connectEvents(propertyName, el);
		el.innerHTML = this._item.getProperty(propertyName) || 'loading...'
		
		return el;
	}
	
	this.getView = function(itemType, viewType) {
		var viewEl = dom.create({ className: 'itemViewType-' + itemType + ' itemView-' + viewType });
		
		var templateHTML = browser.templateFactory.getTemplateHTML(itemType, viewType, viewEl, this);
		
		var propertyMatches = templateHTML.match(templatePropsRegex);
		for (var i=0, propertyMatch; propertyMatch = propertyMatches[i]; i++) {
			var propertyName = propertyMatch.substring(2, propertyMatch.length - 2);
			var placeholderClassName = 'propertyPlaceholder-' + propertyName;
			while (templateHTML.match(propertyMatch)) {
				templateHTML = templateHTML.replace(propertyMatch, '<span class="'+placeholderClassName+'"></span>');
			}
		}
		
		viewEl.innerHTML = templateHTML;
		
		for (var i=0, propertyMatch; propertyMatch = propertyMatches[i]; i++) {
			var propertyName = propertyMatch.substring(2, propertyMatch.length - 2);
			var placeholderClassName = 'propertyPlaceholder-' + propertyName;
			var placeholders = viewEl.getElementsByClassName(placeholderClassName);
			for (var j=0, placeholder; placeholder = placeholders[j]; j++) {
				placeholder.appendChild(this.getPropertyView(propertyName));
			}
		}
		
		return viewEl;
	}
	
	this._onPropertyUpdated = function(propertyName, propertyValue) {
		
		var views = this._propertyViews[propertyName];
		window.top.console.debug('_onPropertyUpdated', views);
		if (!views) { 
			logger.warn('Received property update of property "' + propertyName + '", which is not in the template') 
			return;
		}
		for (var i=0, view; view = views[i]; i++) {
			view.innerHTML = '';
			if (propertyValue.type) {
				var item = common.itemFactory.getItem(propertyValue.id);
				view.appendChild(new ItemView(item).getView(propertyName, 'reference'));
				gClient.subscribeToItem(item);
			} else {
				view.innerHTML = propertyValue;
			}
		}
	}
	
	this._connectEvents = function(propertyName, el) {
		events.add(el, 'dblclick', bind(this, '_makeEditable', propertyName, el));
	}
	
	this._makeEditable = function(propertyName, el) {
		logger.log('_makeEditable', this._item.getId(), this._item.getProperty(propertyName));
		browser.input.setValue(this._item.getProperty(propertyName));
		browser.input.showAt(el, bind(this, function(value){
			el.innerHTML = value; // set the value of the element beneath the input early, so that its size updates correctly
			this._item.setProperty(propertyName, value);
		}));
	}
})
