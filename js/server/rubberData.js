jsio('from common.javascript import map');

exports.itemData = []
exports.userToLabel = { 
	hardcoded: ['bug', 'project', 'user'] 
}
exports.labelToItemIds = {}

var lipsum = "lorem ipsum per se esse fugiendum. itaque aiunt hanc quasi "
    + "naturalem atque insitam in animis nostris inesse notionem, ut "
    + "alterum esse appetendum, alterum aspernandum sentiamus. Alii autem,"
    + " quibus ego assentior, cum a philosophis compluribus permulta.";

var uniqueId = 1;
var itemProperties = {
	project: [
	{ 
		name: 'Panel zoom', milestone: 'v1.0',
		description: 'The panels should zoom in when it gets created, similar to how time machine does it.'
	},{ 
		name: 'Messaging', milestone: 'v1.1',
		description: 'You should be able to send messages to another user, that ends up in their inbox'
	},{ 
		name: 'Events', milestone: 'v2.0',
		description: 'We need a view for events! A subview would be a date, along with setter view.'
	}],

	user: [
		{ username: 'marcus', displayname: 'Marcus Westin', profile: lipsum },
		{ username: 'martin', displayname: 'Martin Hunt', profile: lipsum },
		{ username: 'jon', displayname: 'Jonathan Cowperthwait', profile: lipsum },
		{ username: 'greg', displayname: 'Greg Fair', profile: lipsum },
		{ username: 'vijay', displayname: 'Vijay!', profile: lipsum },
		{ username: 'paul', displayname: 'Paul Sowden', profile: lipsum },
		{ username: 'jones', displayname: 'Jones Martinez', profile: lipsum }
	],
	
	bug: [
		{ title: "Panels break when you close them", user: { type: 'user', id: null },
		 	repro: "1) Open a panel 2) Close the panel 3) Watch it break"}, // id gets set in loop below
		{ title: "Loading text should be a spinner, not static text", user: { type: 'user', id: null },
		 	repro: "Right now everything that is loading just says loading... - would be much nicer if it had a loading spinner image"},
		{ title: "Drawer should be resizable, and you should be able to hide it", user: { type: 'user', id: null },
		 	repro: "The Drawer is static size, and really doesn't have to be there all the time. The user should be able to grab the drawer and make it larger or smaller, as well as hide it completely." }
	]
}

var bugUserId = 0;
var numUsers = itemProperties['user'].length;
for (var type in itemProperties) {
	map(itemProperties[type], function(properties){ 
		var id = uniqueId++;
		var item = { type: type, id: id, properties: properties };
		
		if (type == 'bug') { 
			item.properties.user.id = exports.labelToItemIds['user'][bugUserId++ % numUsers]; 
		}
		exports.itemData.push(item); 
		if (!exports.labelToItemIds[type]) { exports.labelToItemIds[type] = []; }
		exports.labelToItemIds[type].push(id);
	})
}
