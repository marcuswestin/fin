jsio.path.common = 'js';
jsio.path.browser = 'js';

jsio('from common.javascript import bind');
jsio('import net, logging');
jsio('import common.itemFactory');

jsio('import browser.dimensions as dimensions');
jsio('import browser.events as events');
jsio('import browser.css as css');

jsio('import browser.Client');
jsio('import browser.Drawer');
jsio('import browser.panelManager');
jsio('import browser.resizeManager');
jsio('import browser.keystrokeManager');
jsio('import browser.LabelCreator');

jsio('import browser.overlay');

css.loadStyles('browser.app');

gClient = new browser.Client();
gDrawer = new browser.Drawer();
gPanelManager = browser.panelManager;
gCreateLabelFn = function() {
	var labelCreator = new browser.LabelCreator(function(labelName){
		gDrawer.addLabel(labelName);
		browser.overlay.hide();
	});
	browser.keystrokeManager.requestFocus(function(){}, true);
	browser.overlay.show(labelCreator.getElement());
}

gPanelManager.subscribe('PanelFocused', function(panel) {
	var item = panel.getItem();
	document.location.hash = '#/panel/' + item.getType() + '/' + item.getId();
})

gClient.connect(function(){

	document.body.appendChild(gPanelManager.getElement());
	document.body.appendChild(gDrawer.getElement());
	
	gDrawer.subscribe('LabelClick', bind(gPanelManager, 'showLabel'));
	browser.resizeManager.onWindowResize(function(size) {
		var drawerSize = gDrawer.layout();
		gPanelManager.setOffset(drawerSize.width + 40);
		gPanelManager.layout({ width: size.width, height: size.height - 58 });
	});
	
	Meebo('addButton', { id: 'create-label', label: 'Create label', 
		icon: 'img/crystal/16/kdvi.png', onClick: gCreateLabelFn });

	Meebo('addButton', { id: 'create-item', label: 'Create item', 
		icon: 'img/crystal/16/new window.png', onClick: function() {
		var type = prompt('What type of item should I create? (user, bug)');
		gClient.createItem(type, bind(gPanelManager, 'showItem'));
	} });
	
	(function(){
		var parts = document.location.hash.substr(2).split('/')
		if (parts[0] == 'panel') {
			var item = common.itemFactory.getItem(parts[2]);
			item.setType(parts[1]);
			gPanelManager.showItem(item);
		} else {
			gDrawer.focus();
		}
	})()
});

