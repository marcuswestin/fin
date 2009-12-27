require('../../lib/js.io/packages/jsio');
jsio.path.__default__.unshift('packages');

jsio.path.common = '../'
jsio.path.server = '../'

jsio('import net');
jsio('import logging');

//logging.getLogger('RTJPProtocol').setLevel(0);
//logging.getLogger('node.csp.server').setLevel(0);
//logging.getLogger('DelimitedProtocol').setLevel(0);
//logging.getLogger('world.server').setLevel(1);

var CouchDB = require('../../lib/node-couch/module/node-couch').CouchDB;

jsio("import .Database");
var database = new Database(CouchDB);

jsio("import .Server");
server = new Server(database);
net.listen(server, 'csp', {port: 5555});
