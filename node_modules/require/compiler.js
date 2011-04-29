var fs = require('fs'),
	path = require('path'),
	child_process = require('child_process'),
	util = require('./lib/util')

module.exports = {
	compile: compileFile,
	compileCode: compileCode,
	addPath: util.addPath
}

/* compilation
 *************/
function compileFile(filePath, level, basePath, callback) {
	if (!callback) {
		callback = basePath
		basePath = null
	}
	fs.readFile(filePath, function(err, code) {
		if (err) { return callback(err) }
		_compile(code.toString(), level, basePath || path.dirname(filePath), callback)
	})
}

function compileCode(code, level, basePath, callback) {
	if (!callback) {
		callback = basePath
		basePath = null
	}
	_compile(code, level, basePath || process.cwd(), callback)
}

var _compile = function(code, level, basePath, callback) {
	try { var code = 'var require = {}\n' + _compileModule(code, basePath) }
	catch(e) { return callback(e) }
	if (level) { _compress(code, level, callback) }
	else { callback(null, _indent(code)) }
}

// TODO: Look into
// provide a closure to make all variables local: code = '(function(){'+code+'})()'
// --compilation_level [WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS]
// --compute_phase_ordering: Runs the compile job many times, then prints out the best phase ordering from this run
// --define (--D, -D) VAL Override the value of a variable annotated @define. The format is <name>[=<val>], where <name> is the name of a @define variable and <val> is a boolean, number, or a single-quot ed string that contains no single quotes. If [=<val>] is omitted, the variable is marked true
// --print_ast, --print_pass_graph, --print_tree
var _compressionLevels = [null, 'WHITESPACE_ONLY', 'SIMPLE_OPTIMIZATIONS', 'ADVANCED_OPTIMIZATIONS']
function _compress(code, level, callback) {
	var closureArgs = ['-jar', __dirname + '/lib/google-closure.jar', '--compilation_level', _compressionLevels[level]],
		closure = child_process.spawn('java', closureArgs),
		stdout = [],
		stderr = []
	closure.stdout.on('data', function(data) { stdout.push(data); });
	closure.stderr.on('data', function(data) { stderr.push(data); });
	closure.on('exit', function(code) {
		if (code == 0) { callback(null, stdout.join('')) }
		else { callback(new Error(stderr.join(''))) }
	})
	closure.stdin.write(code)
	closure.stdin.end()
}

/* util
 ******/
var _indent = function(code) {
	var lines = code.replace(/\t/g, '').split('\n'),
		result = [],
		indentation = 0
	
	for (var i=0, line; i < lines.length; i++) {
		line = lines[i]
		
		if (line.match(/^\s*\}/)) { indentation-- }
		result.push(_repeat('\t', indentation) + line)
		if (!line.match(/^\s*\/\//) && line.match(/\{\s*$/)) { indentation++ }
	}
	return result.join('\n')
}

var _compileModule = function(code, pathBase) {
	var mainModule = '__main__',
		modules = [mainModule]

	_replaceRequireStatements(mainModule, code, modules, pathBase)
	code = _concatModules(modules)
	code = _minifyRequireStatements(code, modules)
	return code
}

var _minifyRequireStatements = function(code, modules) {
	for (var i=0, modulePath; modulePath = modules[i]; i++) {
		var escapedPath = modulePath.replace(/\//g, '\\/'),
			regex = new RegExp('require\\["'+ escapedPath +'"\\]', 'g')
		code = code.replace(regex, 'require["_'+ i +'"]')
	}
	return code
}

var _globalRequireRegex = /require\s*\(['"][\w\/\.-]*['"]\)/g,
	_pathnameGroupingRegex = /require\s*\(['"]([\w\/\.-]*)['"]\)/

var _replaceRequireStatements = function(modulePath, code, modules, pathBase) {
	var requireStatements = code.match(_globalRequireRegex)

	if (!requireStatements) {
		modules[modulePath] = code
		return
	}

	for (var i=0, requireStatement; requireStatement = requireStatements[i]; i++) {
		var rawModulePath = requireStatement.match(_pathnameGroupingRegex)[1],
			isRelative = (rawModulePath[0] == '.'),
			// use node's resolution system is it's an installed package, e.g. require('socket.io/support/clients/socket.io')
			searchPath = isRelative ? path.join(pathBase, rawModulePath) : (util.resolve(rawModulePath) || '').replace(/\.js$/, ''),
			subModulePath = _findTruePath(searchPath, modules)

		code = code.replace(requireStatement, 'require["' + subModulePath + '"].exports')

		if (!modules[subModulePath]) {
			modules[subModulePath] = true
			var newPathBase = path.dirname(subModulePath),
				newModuleCode = fs.readFileSync(subModulePath + '.js').toString()
			_replaceRequireStatements(subModulePath, newModuleCode, modules, newPathBase)
			modules.push(subModulePath)
		}
	}

	modules[modulePath] = code
}

var _concatModules = function(modules) {
	var code = function(modulePath) {
		return [
			';(function() {',
			'	// ' + modulePath,
			'	var module = require["'+modulePath+'"] = {exports:{}}, exports = module.exports',
				modules[modulePath],
			'})()'
		].join('\n')
	}

	var moduleDefinitions = []
	for (var i=1, modulePath; modulePath = modules[i]; i++) {
		moduleDefinitions.push(code(modulePath))
	}
	moduleDefinitions.push(code(modules[0])) // __main__

	return moduleDefinitions.join('\n\n')
}

var _findTruePath = function(modulePath, modules) {
	function tryPath(p) {
		return (!!modules[p] || path.existsSync(p+'.js'))
	}
	if (tryPath(modulePath)) { return modulePath }
	if (tryPath(modulePath + '/index')) { return modulePath + '/index' }
	if (tryPath(modulePath + 'index')) { return modulePath + 'index' }
	throw new Error('require compiler: could not resolve "' + modulePath + '"')
}

var _repeat = function(str, times) {
	if (times < 0) { return '' }
	return new Array(times + 1).join(str)
}
