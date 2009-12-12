jsio('from common.javascript import Class');
jsio('from net.interfaces import Server');
jsio('import .UbiquityConnection');

var logger = logging.getLogger('UbiquityServer');
logger.setLevel(0);

exports = Class(Server, function(supr) {
	this.init = function() {
		supr(this, 'init', [UbiquityConnection]);
	}
	
	this.subscribeToItemMutations = function(itemId, filter, callback) {
		
	}
	
	this.unsubscribeFromItemMutations = function(itemId, filter) {
		
	}
	
	this.queueMutation = function(mutation) {
		
	}
	
	
});

