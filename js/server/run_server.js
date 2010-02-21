var fin = require('./API')
var sys = require('sys')

fin.startServer({ port: 5555, database: 'fin' })
