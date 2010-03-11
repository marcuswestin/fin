
require('../../lib/js.io/packages/jsio')
require('./fin') // creates fin in global
var couchdb = require('../../lib/node-couchdb/lib/couchdb')
var redis = require('../../lib/redis-node-client/redisclient')

var couchClient = couchdb.createClient(5984, '127.0.0.1').db('fin')
var redisClient = new redis.Client()

redisClient.connect(function(){
	setTimeout(function(){ // why does the jsio import crash on process.cwd if I don't have this here?
		fin.startServer({ couchClient: couchClient, redisClient: redisClient, port: 5555 })
	})
})


