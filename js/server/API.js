// jsio
require('../../lib/js.io/packages/jsio');
jsio.path.common = '../../js'
jsio.path.server = '../../js'

var CouchDB = require('../../lib/node-couch/module/node-couch').CouchDB;

// Let's do it
jsio('import net');
jsio('import logging');
jsio('import server.Database');
jsio('import server.Server');
jsio('import server.Connection');

var finDatabase = new server.Database(CouchDB);
var finServer = new server.Server(finDatabase, server.Connection);

exports.startServer = function() {
	net.listen(finServer, 'csp', {port: 5555});
}

// 
// this._handleItemCreationRequest = function(properties) {
// 	this.server.createItem(properties, bind(this, function(item){
// 		this.sendFrame('ITEM_CREATED', item.asObject());
// 	}))
// }
// 


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

