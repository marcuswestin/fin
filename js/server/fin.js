// jsio
jsio.path.common = '../../js'
jsio.path.server = '../../js'

// Let's do it
jsio('import net');
jsio('from common.javascript import Singleton')
jsio('import server.Database');
jsio('import server.Server');
jsio('import server.ItemSetRedisStore');

fin = Singleton(function() {
	
	this.startServer = function(args) {
		var finDatabase = new server.Database(args.db);
		finDatabase.ensureExists();
		
		var finItemStore = new server.ItemSetRedisStore(args.redisClient)

		var finServer = new server.Server(finDatabase, finItemStore);
		return net.listen(finServer, (args.transport || 'csp'), { port: args.port || 5555 });
	}
	
})

// case 'AUTHENTICATE':
// 		this.server.authenticate(args.email, args.password, bind(this, function(userLabels, errorMessage) {
// 			if (!userLabels) {
// 				this.sendFrame('DEMAND_AUTHENTICATION', { message: errorMessage });
// 				return;
// 			}
// 			this._authenticatedEmail = args.email;
// 			this.sendFrame('WELCOME');
// 			this.sendFrame('LABELS', { labels: userLabels });
// 		}));
// 		break;
// 	
// case 'LABEL_GET_LIST':
// 	this.server.getLabelList(args.label, bind(this, function(list) {
// 		this.sendFrame('LABEL_LIST', { label: args.label, list: list });
// 	}));
// 	break;
// case 'REQUEST_CREATE_LABEL':
// 	this.server.createLabel(this._authenticatedEmail, args.label, args.map, args.filter, bind(this, function(label) {
// 		this.sendFrame('LABELS', { labels: [label] });
// 	}))
// 	break;

