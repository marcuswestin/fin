jsio.path.common = 'js';
jsio.path.browser = 'js';

jsio('from common.javascript import bind');
jsio('import net, logging');
jsio('import common.Item');

jsio('import browser.dimensions as dimensions');
jsio('import browser.events as events');
jsio('import browser.css as css');

jsio('import browser.Client');
jsio('import browser.Drawer');
jsio('import browser.PanelManager');
jsio('import browser.resizeManager');
jsio('import browser.LabelCreator');

jsio('import browser.overlay');

jsio('import browser.Meebo as Meebo');

css.loadStyles('browser.app');

gClient = new browser.Client();
gPanelManager = new browser.PanelManager();
gDrawer = new browser.Drawer();

gClient.connect('csp', "http://" + (document.domain || "127.0.0.1") + ":5555", function(){

	document.body.appendChild(gPanelManager.getElement());
	document.body.appendChild(gDrawer.getElement());
	
	gDrawer.subscribe('LabelClick', bind(gPanelManager, 'showLabel'));
	browser.resizeManager.onWindowResize(function(size) {
		var drawerSize = gDrawer.resize();
		gPanelManager.position(drawerSize.width + 50, drawerSize.top, 
			size.width - drawerSize.width - 100, size.height - 80);
	});
	
	Meebo('addButton', { label: 'Create item', onClick: function() {
		var type = prompt('What type of item should I create? (user, bug)');
		gClient.createItem(type, bind(gPanelManager, 'showItem'));
	} });

	Meebo('addButton', { label: 'Create label', onClick: function() {
		var labelCreator = new browser.LabelCreator(function(labelName){
			gDrawer.addLabel(labelName);
			browser.overlay.hide();
		});
		browser.overlay.show(labelCreator.getElement());
	} });
});

