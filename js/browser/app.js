jsio.path.common = 'js';
jsio.path.browser = 'js';

jsio('from common.javascript import bind');
jsio('import net, logging');
jsio('import common.Item');
jsio('import common.itemFactory');
jsio('import browser.ItemView');
jsio('import browser.UbiquityClient');

gClient = new browser.UbiquityClient();			

gClient.connect('csp', "http://" + (document.domain || "127.0.0.1") + ":5555", function(itemSubscriptions){
	window.top.console.debug(itemSubscriptions);
	
	setTimeout(function(){
		var connecting = document.getElementById('connecting');
		connecting.parentNode.removeChild(connecting);

		var placeHolder = document.getElementById('placeholder');

		for (var i=0, itemId; itemId = itemSubscriptions[i]; i++) {
			var item = common.itemFactory.getItem(itemId);
			var itemView = new browser.ItemView(item);

			placeHolder.appendChild(itemView.getPropertyView('name'))
			placeHolder.appendChild(itemView.getPropertyView('age'))
			placeHolder.appendChild(document.createElement('br'));

			placeHolder.appendChild(itemView.getPropertyView('name'))
			placeHolder.appendChild(itemView.getPropertyView('age'))
			placeHolder.appendChild(document.createElement('br'));
			placeHolder.appendChild(document.createElement('br'));

			item.subscribe('PropertySet', bind(gClient, 'onItemPropertySet', item.getId()));
			gClient.subscribeToItem(item);
		}
		
	})
	
});

