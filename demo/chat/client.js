// This is what we want - it doesn't work yet :)

var fin = require('../../api/client'),
	models = require('../../api/models')

models.process({
	"User": {
		"name": { id:1, type:"Text" }
	},
	"Message": {
		"text": { id:1, type:"Text" },
		"user": { id:2, type:"User" }
	}
})

var marcus = new models.User({ name: 'Marcus Westin' }),
	message = new models.Message({ user:marcus, text:'Hello, world' })
