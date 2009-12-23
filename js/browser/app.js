jsio.path.common = 'js';
jsio.path.browser = 'js';

jsio('from common.javascript import bind');
jsio('import net, logging');
jsio('import common.Item');
jsio('import browser.Client');
jsio('import browser.Drawer');
jsio('import browser.PanelManager');
jsio('import browser.dimensions as dimensions');
jsio('import browser.events as events');
jsio('import browser.css as css');

jsio('import browser.Meebo as Meebo');

css.loadStyles('browser.app');

gClient = new browser.Client();
gDrawer = new browser.Drawer();
gPanelManager = new browser.PanelManager();

gClient.connect('csp', "http://" + (document.domain || "127.0.0.1") + ":5555", function(labels){
	document.body.removeChild(document.getElementById('connecting'));
	document.body.appendChild(gDrawer.getElement());
	document.body.appendChild(gPanelManager.getElement());
	
	function onResize() {
		var size = dimensions.getSize(window);
		var drawerSize = gDrawer.resize();
		gPanelManager.position(drawerSize.width + 50, drawerSize.top, size.width - drawerSize.width - 100, size.height + 20);
	}
	
	gDrawer.subscribe('LabelClick', bind(gPanelManager, 'showLabel'));
	events.add(window, 'resize', onResize);
	
	gDrawer.addLabels(labels);
	
	Meebo('addButton', { label: 'Create item', onClick: function() {
		var type = prompt('What type of item should I create? (user, bug)');
		gClient.createItem(type, bind(gPanelManager, 'showItem'));
	} })
	
	onResize();
});

