jsio.path.common = 'js';
jsio.path.browser = 'js';

jsio('from common.javascript import bind');
jsio('import net, logging');
jsio('import common.Item');
jsio('import common.itemFactory');
jsio('import browser.ItemView');
jsio('import browser.UbiquityClient');
jsio('import browser.Drawer');

gClient = new browser.UbiquityClient();			
gDrawer = new browser.Drawer();
document.body.appendChild(gDrawer.getElement());

gClient.connect('csp', "http://" + (document.domain || "127.0.0.1") + ":5555", function(itemSubscriptions){
	var connecting = document.getElementById('connecting');
	connecting.parentNode.removeChild(connecting);

	var placeHolder = document.getElementById('placeholder');

	for (var i=0, itemId; itemId = itemSubscriptions[i]; i++) {
		var item = common.itemFactory.getItem(itemId);
		var itemView = new browser.ItemView(item);

		placeHolder.appendChild(itemView.getPropertyView('name'));
		placeHolder.appendChild(itemView.getPropertyView('age'));
		placeHolder.appendChild(document.createElement('br'));

		item.subscribe('PropertySet', bind(gClient, 'onItemPropertySet', item.getId()));
		gClient.subscribeToItem(item);
	}
});

