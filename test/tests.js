jsio('from shared.javascript import bind, blockCallback')

function once(fn) {
	return function() {
		var tmpFn = fn
		fn = function() {}
		tmpFn()
	}
}

exports.testQuery = function(assert, onDone) {
	
	var blockedOnDone = blockCallback(onDone),
		_outstanding = 0
	
	function expectQuery(query /* expected mutations */) {
		var expectedMutations = Array.prototype.slice.call(arguments, 1),
			queryId = '#Q' + JSON.stringify(query),
			releaseBlockFn = blockedOnDone.addBlock()

		_outstanding += expectedMutations.length
		fin.query(query, function(mutation) {
			var expectedMutation = expectedMutations.shift()
			expectedMutation.id = queryId
			assert.deepEqual(mutation, expectedMutation, 'mutation was not expected: ' + JSON.stringify(mutation) + ' != ' + JSON.stringify(expectedMutation))
			
			if (expectedMutations.length == 0) { releaseBlockFn() } // expecting no more mutations - release the block
		})
	}
	
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
		expectQuery({ type: 'user' }, 
			{ op:'sadd', args:[] },
			{ op:'sadd', args:[itemId] },
			{ op:'srem', args:[itemId] },
			{ op:'sadd', args:[itemId] }
		)
		
		expectQuery({ type: 'user', name: 'marcus' }, 
			{ op:'sadd', args:[] },
			{ op:'sadd', args:[itemId] },
			{ op:'srem', args:[itemId] },
			{ op:'sadd', args:[itemId] }
		)
		
		Queue.push(bind(fin, 'set', itemId, 'type', 'user'))
		Queue.push(bind(fin, 'set', itemId, 'type', 'something_else'))
		Queue.push(bind(fin, 'set', itemId, 'type', 'user'))
		Queue.push(bind(fin, 'set', itemId, 'name', 'marcus'))
		Queue.push(bind(fin, 'set', itemId, 'name', 'something_else'))
		Queue.push(bind(fin, 'set', itemId, 'name', 'marcus'))
		Queue.popAll()
	})
}
