#!/usr/bin/env node

var sys = require('sys')

require('../lib/js.io/packages/jsio')


jsio.path.shared = '../js/'
jsio.path.server = '../js/'
jsio.path.client = '../js/'
jsio.path.test = '../'

jsio('import client.fin') // makes fin globally accesible
jsio('import test.tests')
jsio('from shared.javascript import blockCallback')
jsio('import base')

// base.logging.setProduction(true) // kill all logging

var onDone = blockCallback(function() {
	sys.puts("Tests done")
	process.exit()
})

fin.connect(function() {
	for (var testName in test.tests) {
		sys.puts(testName)
		test.tests[testName](onDone.addBlock())
	}
})

// var redis = require('../../lib/redis-node-client/lib/redis-client')
// var finServer = new server.Server(redis, server.Connection)
// 
// // for browser clients
// finServer.listen('csp', { port: 5555 }) 
// 
// // for robots
// finServer.listen('tcp', { port: 5556, timeout: 0 }) 
// 
// 
// 
// require('../lib/fin/lib/js.io/packages/jsio')
// 
// 
// jsio('import tasks.robots.BurndownRobot')
// 
// fin.connect(function() {
// 	var burndownRobot = new tasks.robots.BurndownRobot()
// })
