jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');

var logger = logging.getLogger('server.UbiquityConnection');
logger.setLevel(0);

exports = Class(RTJPProtocol, function(supr) {
	
	this.connectionMade = function() {
		logger.log('connectionMade', JSON.stringify(arguments));
		this._subscribedItems = {};
		this.sendFrame('WELCOME');
	}
	
	this.frameReceived = function(id, name, args) {
		logger.log('frameReceived', id, name, JSON.stringify(args));
		
		switch(name) {
			case 'ITEM_SUBSCRIBE':
				var snapshots = [];
				for (var i=0, sub; sub = args.subscriptions[i]; i++) {
					snapshots.push(this.server.getItemSnapshot(sub.itemId, sub.filter));
					this.server.subscribeToItemMutations(sub.itemId, sub.filter, bind(this, 'onItemMutation'));
					this._registerSubscription(sub);
				}
				this.sendFrame('ITEM_SNAPSHOT', { snapshots: snapshots });
				break;
			case 'ITEM_UNSUBSCRIBE':
				for (var i=0, unsub; unsub = args.unsubscriptions[i]; i++) {
					delete this._subscribedItems[unsub.itemId];
					this.server.unsubscribeFromItemMutations(unsub.itemId, unsub.filter);
				}
				break;
			case 'ITEM_MUTATION':
				for (var i=0, mutation; mutation = args.mutations[i]; i++) {
					this.server.queueMutation(mutation);
				}
				break;
			default:
				// logger.warn('Unknown frame type received', id, name, JSON.stringify(args));
				break;
		}
	}
	
	// this.registerSubscription = function(sub) {
	// 	if (!this._subscriptions[sub.itemId]) { this._subscriptions[sub.itemId] = {}; }
	// 	for (var key in sub.filter) {
	// 		this._subscriptions[sub.itemId][key] = true;
	// 	}
	// }
	
	this.onItemMutation = function(mutation) {
		this.sendFrame('ITEM_MUTATION', mutation);
	}
	
	this.connectionLost = function() {
		logger.info('connectionLost');
		this.unsubscribeFromItemMutations
	}

})
