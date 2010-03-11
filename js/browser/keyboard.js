jsio('from common.javascript import Singleton, bind')

jsio('import browser.events as events')

exports = Singleton(function() {
	
	this.init = function() {
		events.add(window, 'keydown', bind(this, '_onKeyDown'))
		events.add(window, 'keyup', bind(this, '_onKeyUp'))
		// events.add(window, 'keypress', bind(this, '_onKeyPress'))
	}
	
	// this.requestFocus = function(handler, muteGlobals) {
	// 	this._keystrokeHandler = handler
	// 	this._muteGlobals = muteGlobals
	// 	return this._keystrokeHandler
	// }
	
	// this.release = function(handler) {
	// 	if (handler != this._keystrokeHandler) { return }
	// 	this._keystrokeHandler = null
	// }
	
	// this.handleKeys = function(keyMap, muteGlobals) {
	// 	this._currentKeyMap = keyMap
	// 	return this.requestFocus(bind(this, '_applyEventToKeyMap'), muteGlobals)
	// }
	
	// this._applyEventToKeyMap = function(e) {
	// 	var key
	// 	if (e.charCode != 0) {
	// 		key = String.fromCharCode(e.charCode)
	// 	} else if (e.keyCode != 0) {
	// 		key = events.keyCodes[e.keyCode]
	// 	}
	// 	if (this._currentKeyMap[key]) {
	// 		this._currentKeyMap[key]()
	// 		events.cancel(e)
	// 	}
	// }

	this.shiftIsDown = function() { return this._shiftIsDown }
	
	this._onKeyDown = function(e) {
		if (e.keyCode == events.keyCodes['shift']) { this._shiftIsDown = true }
		// if (this._muteGlobals) { return }
		// this._matchGlobals(e)
	}
	
	this._onKeyUp = function(e) {
		if (e.keyCode == events.keyCodes['shift']) { this._shiftIsDown = false }
	}
	
	// this._onKeyPress = function(e) {
	// 	if (!this._keystrokeHandler) { return }
	// 	this._keystrokeHandler(e)
	// }
	
	// var globalKeyMap
	// this._initGlobalKeyMap = function() {
	// 	globalKeyMap = {}
	// 	globalKeyMap['escape'] = bind(this, function(){
	// 		gFocusedPanel.close()
	// 		if (!gPanelManager.hasPanels()) { gDrawer.focus() }
	// 	})
	// 	globalKeyMap['a'] = bind(gDrawer, 'focusLeftmost')
	// 	globalKeyMap['s'] = bind(gDrawer, 'focus')
	// 	globalKeyMap['d'] = bind(gPanelManager, 'focus')
	// 	globalKeyMap['n'] = bind(gPanelManager, 'focusPreviousPanel')
	// 	globalKeyMap['m'] = bind(gPanelManager, 'focusNextPanel')
	// 	globalKeyMap['tab'] = bind(this, function() {
	// 		if (this._shiftIsDown) {
	// 			gPanelManager.focusPreviousPanel()
	// 		} else {
	// 			gPanelManager.focusNextPanel()
	// 		}
	// 	})
	// 	
	// 	for (var i=1; i<=9; i++) {
	// 		globalKeyMap[i.toString()] = bind(gPanelManager, 'focusPanelIndex', i - 1)
	// 	}
	// 	globalKeyMap['0'] = bind(gPanelManager, 'focusLastPanel')
	// }
	// 
	// this._matchGlobals = function(e) {
	// 	if (!globalKeyMap) { this._initGlobalKeyMap() }
	// 	var keyName = events.keyCodes[e.keyCode]
	// 	if (!globalKeyMap[keyName]) { return }
	// 	
	// 	globalKeyMap[keyName]()
	// 	events.cancel(e)
	// 	return true
	// }
})
