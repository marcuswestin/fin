jsio('from common.javascript import Class, bind');
jsio('from net.protocols.rtjp import RTJPProtocol');

var logger = logging.getLogger(jsio.__path);

exports = Class(RTJPProtocol, function(supr) {
	
	this.connectionMade = function() {
		logger.log('connectionMade');
		this._itemSubscriptionIds = {};
		logger.log('Retrieve labels for user')
		this.sendFrame('DEMAND_AUTHENTICATION');
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
			case 'LABEL_GET_LIST':
				this.server.getLabelList(args.label, bind(this, function(list) {
					this.sendFrame('LABEL_LIST', { label: args.label, list: list });
				}));
				break;
			case 'REQUEST_CREATE_ITEM':
				this.server.createItem(args.type, bind(this, function(item){
					this.sendFrame('ITEM_CREATED', item.asObject());
				}))
				break;
			case 'REQUEST_CREATE_LABEL':
				this.server.createLabel(args.label, args.map, args.filter, bind(this, function(label) {
					this.sendFrame('LABELS', { labels: [label] });
				}))
				break;
			case 'AUTHENTICATE':
				this.server.authenticate(args.email, args.password, bind(this, function(userLabels, errorMessage) {
					if (!userLabels) {
						this.sendFrame('DEMAND_AUTHENTICATION', { message: errorMessage });
						return;
					}
					this._authenticatedEmail = args.email;
					logger.log('Received labels! Send welcome');
					this.sendFrame('WELCOME');
					this.sendFrame('LABELS', { labels: userLabels });
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
