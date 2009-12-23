jsio('import browser.dom as dom');
jsio('import browser.events as events');

var bar = dom.create({ parent: document.body })
dom.setStyle(bar, {
	position: 'fixed',
	bottom: '0px',
	width: '100%',
	height: '26px',
	background: "#aaa"
});

var commands = {};

exports = function(command) {
	var args = Array.prototype.slice.call(arguments, 1);
	commands[command].apply(this, args);
}

commands.addButton = function(params) {
	var button = dom.create({ parent: bar, text: params.label });
	dom.setStyle(button, { display: 'inline', fontSize: 12, padding: 3, background: '#eee', 
		border: '1px solid #666', 'float': 'left', margin: 3, cursor: 'pointer' });
	events.add(button, 'click', params.onClick);
}