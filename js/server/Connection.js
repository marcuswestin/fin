jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');

var logger = logging.getLogger('server.Connection');
logger.setLevel(0);

exports = Class(RTJPProtocol, function(supr) {
	
	this.connectionMade = function() {
		logger.log('connectionMade');
		this._itemSubscriptionIds = {};
		var labels = this.server.getLabelsForUser('hardcoded');
		this.sendFrame('WELCOME', { labels: labels });
	}
	
	this.sendFrame = function(name, args) {
		logger.log('sendFrame', name, JSON.stringify(args));
		supr(this, 'sendFrame', arguments);
	}
	
	this.frameReceived = function(id, name, args) {
		logger.log('frameReceived', id, name, JSON.stringify(args));
		
		switch(name) {
			case 'ITEM_SUBSCRIBE':
				logger.log('subscribing to item', args.id);
				this.server.getItem(args.id, bind(this, function(item){
					var subId = this.server.subscribeToItemMutations(item, bind(this, 'onItemMutated'));
					this._itemSubscriptionIds[args.id] = subId;
					this.sendFrame('ITEM_SNAPSHOT', item.asObject());
				}));
				break;
			case 'ITEM_MUTATING':
				this.server.handleMutation(args.mutation);
				break;
			case 'LABEL_GET_ITEMS':
				this.server.getItemIdsForLabel(args.label, bind(this, function(itemIds) {
					this.sendFrame('LABEL_ITEMS', { label: args.label, itemIds: itemIds });
				}));
				break;
			default:
				logger.warn('Unknown frame type received', id, name, JSON.stringify(args));
				break;
		}
	}
	
	this.onItemMutated = function(mutation) {
		this.sendFrame('ITEM_MUTATED', { mutation: mutation });
	}
	
	this.connectionLost = function() {
		logger.info('connectionLost');
	}

})
