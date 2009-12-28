jsio('from common.javascript import Class, bind');
jsio('import browser.dom as dom');

jsio('import browser.UIComponent');

var logger = logging.getLogger(jsio.__path);

css.loadStyles(jsio.__path);

exports = Class(browser.UIComponent, function(supr) {
	
	this._init = function(labelCreatedCallback) {
		supr(this, 'init');
		this._labelCreatedCallback = labelCreatedCallback;
	}
	
	this.createContent = function() {
		this.addClassName('LabelCreator');
		this._criteria = [];
		this._nameInput = dom.create({ parent: this._element, type: 'input' });
		this._nameInput.value = 'label name';
		this._inputs = dom.create({ parent: this._element, className: 'inputs' });

		var submitButton = dom.create({ parent: this._element, type: 'button', html: 'create label' });
		var conditionButton = dom.create({ parent: this._element, type: 'button', html: 'add condition' });
		
		events.add(conditionButton, 'click', bind(this, '_addCriteriumInput'))
		events.add(submitButton, 'click', bind(this, '_submit'))
		
		this._addCriteriumInput();
		setTimeout(bind(this, function(){
			this._nameInput.focus();
			this._nameInput.select();
		}))
	}
	
	this._addCriteriumInput = function() {
		var container = dom.create({ parent: this._inputs, className: 'criteriaInput' });
		var criterium = {};
		this._criteria.push(criterium);
		criterium.keyInput = dom.create({ parent: container, type: 'input', className: 'key' });
		dom.create({ parent: container, type: 'span', text: '==' });
		criterium.valueInput = dom.create({ parent: container, type: 'input', className: 'key' });
		criterium.keyInput.focus();
	}

	this._getFunctionString = function(matchCode) {
		var criteria = [];
		for (var i=0, criterium; criterium = this._criteria[i]; i++) {
			var key = criterium.keyInput.value;
			var value = criterium.valueInput.value;
			if (!key || !value) { continue; }
			var keyObj = (key == 'type' ? 'doc.' : 'doc.properties.') + key;
			criteria.push(keyObj + ' == "' + value + '"');
		}
		return 'function(doc) { if(' + criteria.join(' && ') + ') { ' + matchCode + ' } }';
	}
	
	this._submit = function() {
		var mapFunction = this._getFunctionString('emit(null, { id: doc._id, type: doc.type })');
		var filterFunction = this._getFunctionString('return true');
		gClient.createLabel(this._nameInput.value, mapFunction, filterFunction, this._labelCreatedCallback);
	}
})
