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
			case 'ITEM_PROPERTY_SET': // This is just for development - we should pass mutations as opposeed to values
				this.server.dispatchItemPropertyUpdated(args.id, args.name, args.value);
				break;
			case 'ITEM_SUBSCRIBE':
				logger.log('subscribing to item', args.id);
				// var subId = this.server.subscribeToItemMutations(itemDescr.id, bind(this, 'onItemMutation'));
				this.server.getItem(args.id, bind(this, function(item){
					var subId = this.server.subscribeToItemPropertyChange(args.id, bind(this, 'onItemPropertyUpdated'));
					this._itemSubscriptionIds[args.id] = subId;
					this.sendFrame('ITEM_SNAPSHOT', item.asObject());
				}));
				break;
			case 'ITEM_UNSUBSCRIBE':
				for (var i=0, unsub; unsub = args.unsubscriptions[i]; i++) {
					var subId = this._itemSubscriptionIds[unsub.itemId];
					delete this._itemSubscriptionIds[unsub.itemId];
					this.server.unsubscribeFromItemMutations(subId, unsub.itemId);
				}
				break;
			case 'ITEM_MUTATION':
				for (var i=0, mutation; mutation = args.mutations[i]; i++) {
					this.server.queueMutation(mutation);
				}
				break;
			case 'LABEL_GET_ITEMS':
				var itemIds = this.server.getItemIdsForLabel(args.label);
				this.sendFrame('LABEL_ITEMS', { label: args.label, itemIds: itemIds });
				break;
			default:
				logger.warn('Unknown frame type received', id, name, JSON.stringify(args));
				break;
		}
	}
	
	// Unused
	this.onItemMutation = function(mutation) {
		this.sendFrame('ITEM_MUTATION', mutation);
	}
	
	this.onItemPropertyUpdated = function(itemId, propertyName, propertyValue) {
		this.sendFrame('ITEM_PROPERTY_UPDATED', { id: itemId, name: propertyName, value: propertyValue });
	}
	
	this.connectionLost = function() {
		logger.info('connectionLost');
		for (var itemId in this._itemSubscriptionIds) {
			this.server.unsubscribeFromItemMutations(itemId, this._itemSubscriptionIds[itemId]);
		}
	}

})
