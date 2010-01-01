jsio('from common.javascript import Class, bind');

exports = Class(function(){
	
	this.init = function(animateFn, duration) {
		this._animateFn = animateFn;
		this._delta = 30;
		this._duration = duration || 500;
	}
	
	this.animate = function() {
		if (this._interval) { clearInterval(this._interval); }
		this._startTime = new Date().getTime();
		this._interval = setInterval(bind(this, '_doInterval'), this._delta);
	}
	
	this._doInterval = function() {
		var currentProportion = ((new Date().getTime() - this._startTime) / this._duration);
		if (currentProportion > 1) { currentProportion = 1; }
		var transformedProportion = this._transform(currentProportion);
		this._animateFn(transformedProportion);
		if (currentProportion == 1) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}
	
	this._transform = function(n) {
		return n * (2 - n);
	}
})