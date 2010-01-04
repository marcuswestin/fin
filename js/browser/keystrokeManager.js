jsio('from common.javascript import Singleton')

jsio('import browser.events as events');

exports = Singleton(function(){
	
	this.init = function() {
		events.add(window, 'keydown', bind(this, '_onKeyDown'));
		events.add(window, 'keyup', bind(this, '_onKeyUp'));
		events.add(window, 'keypress', bind(this, '_onKeyPress'));
	}
	
	this.requestFocus = function(handler, muteGlobals) {
		this._keystrokeHandler = handler;
		this._muteGlobals = muteGlobals;
		return this._keystrokeHandler;
	}
	
	this.release = function(handler) {
		if (handler != this._keystrokeHandler) { return; }
		this._keystrokeHandler = null;
	}
	
	this.handleKeys = function(keyMap, muteGlobals) {
		this._currentKeyMap = keyMap;
		return this.requestFocus(bind(this, '_applyEventToKeyMap'), muteGlobals);
	}
	
	this._applyEventToKeyMap = function(e) {
		var key;
		if (e.charCode != 0) {
			key = String.fromCharCode(e.charCode);
		} else if (e.keyCode != 0) {
			key = events.keyCodes[e.keyCode];
		}
		if (this._currentKeyMap[key]) {
			this._currentKeyMap[key]();
			events.cancel(e);
		}
	}

	this.shiftIsDown = function() { return this._shiftIsDown; }
	
	this._onKeyDown = function(e) {
		if (e.keyCode == events.keyCodes['shift']) { this._shiftIsDown = true; }
		if (this._muteGlobals) { return; }
		this._matchGlobals(e);
	}
	
	this._onKeyUp = function(e) {
		if (e.keyCode == events.keyCodes['shift']) { this._shiftIsDown = false; }
	}
	
	this._onKeyPress = function(e) {
		if (!this._keystrokeHandler) { return; }
		this._keystrokeHandler(e);
	}

	this._matchGlobals = function(e) {
		// jsio package bug: if this gets imported at top of file, 
		// browser.keystrokeManager becomes null in ListComponent.

		switch(e.keyCode.toString()) {
			case events.keyCodes['a']:
			case events.keyCodes['1']:
				gDrawer.focusLeftmost();
				break;
			case events.keyCodes['s']:
			case events.keyCodes['2']:
				gDrawer.focus();
				break;
			case events.keyCodes['d']:
			case events.keyCodes['3']:
				gPanelManager.focus();
				break;
			case events.keyCodes['m']:
				gPanelManager.focusNextPanel();
				break;
			case events.keyCodes['n']:
				gPanelManager.focusPreviousPanel();
				break;
			case events.keyCodes['escape']:
				gFocusedPanel.close();
				if (!gPanelManager.hasPanels()) {
					gDrawer.focus();
				}
				break;
			default:
				return false; // did not handle the event
		}
		events.cancel(e);
		return true;
	}
})
