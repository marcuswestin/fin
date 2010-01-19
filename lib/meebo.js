(function(){
	var useRealMeebo = false;

	if (useRealMeebo) {
		window.Meebo = function(){(Meebo._=Meebo._||[]).push(arguments)};
		(function(q){
			var d=document, b=d.body, m=b.insertBefore(d.createElement('div'), b.firstChild), s=d.createElement('script');
			m.id='meebo'; m.style.display='none'; m.innerHTML='<iframe id="meebo-iframe"></iframe>';
			s.src='http'+(q.https?'s':'')+'://'+(q.stage?'stage-':'')+'cim.meebo.com/cim/cim.php?network='+q.network;
			b.insertBefore(s, b.firstChild);
		})({
			network: 'finmeebo_lo00ma'
		});
		Meebo("domReady");
	} else {
		jsio('import browser.dom as dom');
		jsio('import browser.events as events');

		var commands = {};
		window.Meebo = function(command) {
			var args = Array.prototype.slice.call(arguments, 1);
			commands[command].apply(this, args);
		}

		var bar = dom.create({ parent: document.body })
		dom.setStyle(bar, {
			position: 'fixed',
			bottom: '0px',
			width: '100%',
			height: '26px',
			background: "#aaa",
			zIndex: 1
		});

		commands.addButton = function(params) {
			var button = dom.create({ parent: bar, text: params.label });
			dom.setStyle(button, { display: 'inline', fontSize: 12, padding: 3, background: '#eee', 
				border: '1px solid #666', 'float': 'left', margin: 3, cursor: 'pointer' });
			events.add(button, 'click', params.onClick);
		}
	}
})();