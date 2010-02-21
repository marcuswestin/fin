var sys = require('sys');

if (process.ARGV.length != 4) {
	sys.puts('Usage: node create_account.js [username] [password]')
	process.exit();
}

require('../../lib/js.io/packages/jsio');
var couchdb = require('../../lib/node-couchdb/lib/couchdb');

jsio.path.common = '../'
jsio.path.server = '../'

jsio('import logging');
jsio('import server.Database');
jsio('import common.sha1');

var database = new server.Database(couchdb, 'fin');

var username = process.ARGV[2];
var password = process.ARGV[3];

database.createUser(username, common.sha1(password), function(item) {
	sys.puts('Created user!');
})
