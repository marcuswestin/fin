require('../../lib/js.io/packages/jsio');

jsio.path.common = '../'
jsio.path.server = '../'

jsio('import net');
jsio('import logging');
jsio('import server.Database');
jsio('import server.Server');

var CouchDB = require('../../lib/node-couch/module/node-couch').CouchDB;
var database = new server.Database(CouchDB);

server = new server.Server(database);
net.listen(server, 'csp', {port: 5555});
