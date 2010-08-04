var assert = jsio.__env.require('assert')

jsio('from shared.javascript import bind, blockCallback, map')

var rand = new Date().getTime()

function once(fn) {
	return function() {
		var tmpFn = fn
		fn = function() {}
		tmpFn()
	}
}

function expectQuery(releaseBlockFn, query, testMessage /* expected mutations */) {
	var expectedMutations = Array.prototype.slice.call(arguments, 3)
	
	for (var i=0, expectedMutation; expectedMutation = expectedMutations[i]; i++) {
		expectedMutation.id = '#Q' + JSON.stringify(query);
	}
	
	fin.query(query, function(mutation) {
		if (expectedMutations.length == 0) { assert.fail(testMessage + " - received unexpected mutation: " + JSON.stringify(mutation)) }
		var expectedMutation = expectedMutations.shift()
		expectedMutation.args.sort()
		mutation.args.sort()
		assert.deepEqual(mutation, expectedMutation, testMessage + ' - mutation was not expected: \n' + JSON.stringify(mutation) + '\n != \n' + JSON.stringify(expectedMutation))
		if (expectedMutations.length == 0) { releaseBlockFn() } // expecting no more mutations - release the block
	})
}



exports.testQuery = function(onDone) {
	
	var blockedOnDone = blockCallback(onDone, true)
	
	Queue = {
		push: function(callback) {
			Queue._q.unshift(callback);
		},
		popAll: function() { 
			if (!Queue._q.length) { return }
			Queue._q.pop()()
			setTimeout(bind(Queue, 'popAll'), 100)
		},
		_q: []
	}
	
	fin.create({}, function(itemId) {
		var val1 = 'val1' + rand,
			val2 = 'val2' + rand,
			prop1 = 'prop1' + rand,
			prop2 = 'prop2' + rand,
			blah = 'blah' + rand,
			query1 = {},
			query2 = {}
		
		query1[prop1] = val1
		
		query2[prop1] = val1
		query2[prop2] = val2
		
		expectQuery(blockedOnDone.addBlock(), query1, 'Single param query test',
			{ op:'sadd', args:[] },
			{ op:'sadd', args:[itemId] },
			{ op:'srem', args:[itemId] },
			{ op:'sadd', args:[itemId] }
		)
		
		expectQuery(blockedOnDone.addBlock(), query2, 'Double param query test',
			{ op:'sadd', args:[] },
			{ op:'sadd', args:[itemId] },
			{ op:'srem', args:[itemId] },
			{ op:'sadd', args:[itemId] }
		)
		
		Queue.push(bind(fin, 'set', itemId, prop1, val1))
		Queue.push(bind(fin, 'set', itemId, prop1, blah))
		Queue.push(bind(fin, 'set', itemId, prop1, val1))
		Queue.push(bind(fin, 'set', itemId, prop2, val2))
		Queue.push(bind(fin, 'set', itemId, prop2, blah))
		Queue.push(bind(fin, 'set', itemId, prop2, val2))
		Queue.popAll()
	})
}


exports.testQuery = function(onDone) {
	var doubleQuery = {},
		doubleQueryProp = 'double_query_prop' + rand,
		doubleQueryVal = 'double_query_val' + rand,
		hasSubscribed = false,
		items = []
		
	doubleQuery[doubleQueryProp] = doubleQueryVal
	function createItems(numItems, itemId) {
		if (itemId) { items.push(itemId) }
		if (numItems > 0) {
			fin.create(doubleQuery, bind(this, createItems, numItems - 1))
		} else {
			fin.query(doubleQuery, function(mutation) {
				if (hasSubscribed) { return } hasSubscribed = true
				setTimeout(function() {
					expectQuery(onDone, doubleQuery, 'Local cache of query results',
						{ op:'sadd', args: items }
					)
				}, 750)
			})
		}
	}
	createItems(10);
}