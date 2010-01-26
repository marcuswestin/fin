jsio('from common.javascript import Singleton, bind');
jsio('import browser.dimensions')
jsio('import browser.dom')
jsio('import browser.events as events')
jsio('import browser.caret')
jsio('import browser.keystrokeManager');

exports = Singleton(function(){
	
	var PADDING = 4;
	var BORDER = 2;

	this.init = function() {
		this._input = document.createElement('textarea');
		this._input.style.position = 'absolute';
		this._input.style.padding = '1px 0 0 3px'
		this._input.style.overflow = 'hidden';
		events.add(this._input, 'blur', bind(this, 'hide'))
	}
	
	this.setValue = function(value) {
		this._input.value = value;
	}
	
	this.showAt = function(view, onMutationCallback, onHideCallback) {
		this._view = view;
		this._onMutationCallback = onMutationCallback;
		this._onHideCallback = onHideCallback;
		
		this._input.style.fontSize = browser.dom.getStyle(view.getElement(), 'font-size');
		this._input.style.fontFamily = browser.dom.getStyle(view.getElement(), 'font-family');
		this._input.style.fontWeight = browser.dom.getStyle(view.getElement(), 'font-weight');
		
		view.subscribe('Resize', bind(this, '_layout'))
		this._layout();
		
		if (!this._input.parentNode) { 
			document.body.appendChild(this._input); 
			this._input.focus();
		}
		
		this._keystrokeHandler = browser.keystrokeManager.requestFocus(bind(this, 'onKeyPress'), true);
	}
	
	this._layout = function() {
		var dimensions = browser.dimensions.getDimensions(this._view.getElement());
		
		this._input.style.top = dimensions.top - PADDING - BORDER / 2 + 'px';
		this._input.style.left = dimensions.left - PADDING - BORDER / 2 + 'px';
		this._input.style.width = dimensions.width + PADDING * 2 + BORDER * 2 + 'px';
		this._input.style.height = dimensions.height + PADDING * 2 + BORDER * 2 + 'px';
	}
	
	this.hide = function() {
		browser.keystrokeManager.release(this._keystrokeHandler);
		document.body.removeChild(this._input);
		if (this._onHideCallback) { this._onHideCallback(); }
	}
	
	this.onKeyPress = function(e) {
		// TODO: Deal with pasting
		if (e.metaKey && e.keyCode != events.keyCodes['enter']) { return; }
		
		var position = browser.caret.getPosition(this._input);
		var selectionLength = position.end - position.start;
		var mutation = { position: position.caret - selectionLength };
		
		if (e.keyCode == events.keyCodes['enter'] && !browser.keystrokeManager.shiftIsDown()) {
			this._input.blur();
			events.cancel(e);
			return;
		} else if (e.keyCode == events.keyCodes['backspace']) {
			if (selectionLength) {
				mutation.deletion = selectionLength;
			} else {
				mutation.position -= 1;
				mutation.deletion = 1;
			}
		} else if (e.keyCode == events.keyCodes['enter']) {
			mutation.addition = "\n";
			if (selectionLength) {
				mutation.deletion = selectionLength;
			}
		} else if (e.charCode) {
			mutation.addition = String.fromCharCode(e.charCode);
			if (selectionLength) {
				mutation.deletion = selectionLength;
			}
		}
		
		// Don't publish no op mutations
		if (!mutation.deletion && !mutation.addition) { return; }
		
		this._onMutationCallback(mutation, this._input.value);
	}
})