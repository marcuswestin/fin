
require('../../lib/js.io/packages/jsio')
require('./fin') // creates fin in global
var couchdb = require('../../lib/node-couchdb/lib/couchdb')

var dbHost = '127.0.0.1', dbPort = 5984, dbName = 'fin'
var db = couchdb.createClient(dbPort, dbHost).db(dbName)

fin.startServer({ db: db, port: 5555 })
