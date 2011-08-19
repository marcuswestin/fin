var Class = require('std/Class'),
	store = require('store.js'),
	bind = require('std/bind')

module.exports = Class(function() {

	this._isOfflineKey = '__fin_isOffline_sync__'
	
	this.init = function(fin) {
		this._isOffline = true
		fin
			.subscribe('Online', bind(this, this._onOnline))
			.subscribe('Offline', bind(this, this._onOffline))
	}
	
	this.get = function(key) {
		return store.get(key)
	}
	
	this.set = function(key, value) {
		console.log('set', key, value, this._isOffline)
		if (this._isOffline) {
			var syncKeys = store.get(this._isOfflineKey)
			if (!syncKeys) { syncKets = {} }
			syncKeys[key] = true
			store.set(this._isOfflineKey, syncKeys)
		}
		store.set(key, value)
	}
	
	this._onOnline = function() {
		var keysToSync = store.get(this._isOfflineKey)
		store.remove(this._isOfflineKey)
		console.log('Keys to sync', keysToSync)
		this._isOffline = false
	}
	
	this._onOffline = function() {
		this._isOffline = true
	}
})