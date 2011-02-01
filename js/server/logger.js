var debug = true

module.exports = {
	log: !debug ? function(){} : console.log
}
