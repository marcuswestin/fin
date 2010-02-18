jsio.path.browser = 'js';
jsio.path.common = 'js';

jsio('import logging');
jsio('import browser.API as fin')

fin.connect(function(){
	var itemId = '2a37d2692106e306983d2f55b0ec58e1';
	var item = fin.getItem(itemId);
	
	var templateString = '\
		<div class="computer">\
			<span class="brand"> {{ brand }} </span>\
			<span class="model"> {{ model }} </span>\
			<br />Brand: (( Input brand ))\
			<br />Model: (( Input model ))\
		</div>';
	var viewEl = fin.applyTemplate(templateString, itemId)
	var inputEl = fin.getInput(itemId, 'model')
	document.getElementById('view').appendChild(viewEl)
	document.getElementById('view').appendChild(inputEl)
})