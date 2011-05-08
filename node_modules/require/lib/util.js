var path = require('path'),
	fs = require('fs')

module.exports = {
	getDependencyList: getDependencyList,
	getRequireStatements: getRequireStatements,
	getRequireStatementPath: getRequireStatementPath,
	resolve: resolve,
	resolveRequireStatement: resolveRequireStatement
}

function getDependencyList(path) {
	return _findRequiredModules(path).concat(path)
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g
function getRequireStatements(code) {
	return code.match(_globalRequireRegex) || []
}

var _pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/
function getRequireStatementPath(requireStmnt) {
	return requireStmnt.match(_pathnameGroupingRegex)[1]
}

function resolve(searchPath, pathBase) {
	var modulePath
	if (searchPath[0] == '.') {
		modulePath = path.resolve(pathBase, searchPath)
	} else {
		require.paths.unshift(pathBase)
		try { modulePath = require.resolve(searchPath) }
		catch(err) {}
		require.paths.splice(0, 1)
	}
	return modulePath
}

function resolveRequireStatement(requireStmnt, currentPath) {
	var rawPath = getRequireStatementPath(requireStmnt),
		cwd = path.dirname(currentPath) + '/',
		isRelative = (rawPath[0] == '.'),
		searchPath = (isRelative ? path.resolve(cwd + rawPath) : rawPath)
	return resolve(searchPath)
}

var _findRequiredModules = function(absolutePath, _requiredModules) {
	if (!_requiredModules) { _requiredModules = [] }
	_requiredModules[absolutePath] = true
	var code = _readFile(absolutePath),
		requireStatements = getRequireStatements(code)
	
	for (var i=0, requireStmnt; requireStmnt = requireStatements[i]; i++) {
		var absPath = resolveRequireStatement(requireStmnt, absolutePath)
		if (_requiredModules[absPath]) { continue }
		_findRequiredModules(absPath, _requiredModules)
		_requiredModules.push(absPath)
	}
	return _requiredModules
}

var _readFile = function(path) {
	return fs.readFileSync(path).toString()
}

