jsio.path.client = '../js'
jsio.path.shared = '../js'
jsio('import client.fin')

var gItemType = 'testReduceType'
var gProperty = 'testReduceProperty'
if (document.getElementById('template')) {
	gTemplateString = document.getElementById('template').innerHTML.replace('SUM_PROPERTY', gProperty)
}


fin.connect(onConnected) // onConnected is defined in item-set-reduce.html and item-set-reduce-frame.html, respectively


function forEach(array, fn) {
	if (!array) { return }
	for (var i=0, item; item = array[i]; i++) {
		fn(item)
	}
}