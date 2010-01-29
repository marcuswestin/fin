var sys = require('sys');

if (process.ARGV.length != 4) {
	sys.puts('Usage: node create_account.js [username] [password]')
	process.exit();
}

require('../../lib/js.io/packages/jsio');
var CouchDB = require('../../lib/node-couch/module/node-couch').CouchDB;

jsio.path.common = '../'
jsio.path.server = '../'

jsio('import logging');
jsio('import server.Database');
jsio('import common.sha1');

var database = new server.Database(CouchDB);

var username = process.ARGV[2];
var password = process.ARGV[3];

database.createUser(username, common.sha1(password), function(item) {
	sys.puts('Created user!');
})
