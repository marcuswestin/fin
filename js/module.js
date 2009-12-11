;(function(){

	/* Util functions
	 ****************/

	function bind(context, fn/*, args... */) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function(){
			return fn.apply(context, args.concat(Array.prototype.slice.call(arguments, 0)))
		}
	}

	function logToDom() {
		if (!logToDom.loggerDiv) { logToDom.loggerDiv = document.body.appendChild(document.createElement('div')); }
		var logRow = logToDom.loggerDiv.appendChild(document.createElement('div'));
		logRow.innerHTML = Array.prototype.slice.call(arguments).join(', ');
	}
	var log = (typeof console != 'undefined' && console.log) ? console.log : logToDom;


	/* Environment
	 *************/

	if(typeof exports == 'undefined') {
		var module = window.module = bind(this, _moduleImport, window, '');
	} else if (typeof GLOBAL != 'undefined') {
		var module = GLOBAL.module = bind(this, _moduleImport, GLOBAL, '');
	}

	/* Configuration
	 ***************/
	// These are the configurable options. Each can be set after having loaded module.js by e.g. module.path.push('js');

	module.path = ['.'];
	
	if(typeof eval('(function(){})') == 'undefined') {
		eval = function(src) {
			try {
				eval('module.__f=' + src);
				return module.__f;
			} finally {
				delete module.__f;
			}
		}
	}

	/* Code fetching and processing functions
	 ****************************************/

	var compile = function(context, args) {
		var code = "(function(_){with(_){delete _;(function(){"
			+ args.src
			+ "\n}).call(this)}})\n//@ sourceURL=" + args.location;
			
		try { var fn = eval(code); } catch(e) {
			if(e instanceof SyntaxError) {
				var src = 'javascript:document.open();document.write("<scr"+"ipt src=\'' 
					+ args.location
					+ '\'></scr"+"ipt>")';
					
				var callback = function() {
					var el = document.createElement('iframe');
					with(el.style) { position = 'absolute'; top = left = '-999px'; width = height = '1px'; visibility = 'hidden'; }
					el.src = src;
					setTimeout(function() {
						document.body.appendChild(el);
					}, 0);
				}
				
				if(document.body) { callback(); }
				else { window.addEventListener('load', callback, false); }
				throw new Error("forcing halt on load of " + args.location);
			}
			throw e;
		}
		try {
			fn.call(context.exports, context);
		} catch(e) {
			log('error when loading ' + args.location);
			throw e;
		}
		return true;
	}

	var windowCompile = function(context, args) {
		var f = "(function(_){with(_){delete _;(function(){" + args.src + "\n}).call(this)}})\n//@ sourceURL=" + args.location;
		var fn = eval(f);
		fn.call(context.exports, context);
	}
	
	var createXHR = function() {
		return window.XMLHttpRequest ? new XMLHttpRequest() 
			: window.ActiveXObject ? new ActiveXObject("Msxml2.XMLHTTP")
			: null;
	}
	
	var modulePathCache = {};
	function getModulePathPossibilities(pathString) {
		var segments = pathString.split('.')
		var modPath = segments.join('/');
		var out;
		if (segments[0] in modulePathCache) {
			out = [[modulePathCache[segments[0]] + '/' + modPath + '.js', null]];
		} else {
			out = [];
			for (var i = 0, path; path = module.path[i]; ++i) {
				out.push([path + '/' + modPath + '.js', path]);
			}
		}
		return out;
	}

	var getModuleSourceAndPath = function(pathString) {
		var baseMod = pathString.split('.')[0];
		var paths = getModulePathPossibilities(pathString);
		for (var i = 0, path; path = paths[i]; ++i) {
			var cachePath = path[1];
			var path = path[0];
			var xhr = createXHR();
			var failed = false;
			try {
				xhr.open('GET', path, false);
				xhr.send(null);
			} catch(e) {
				failed = true;
			}
			if (failed || // firefox file://
				xhr.status == 404 || // all browsers, http://
				xhr.status == -1100 || // safari file://
				// XXX: We have no way to tell in opera if a file exists and is empty, or is 404
				// XXX: Use flash?
				//(!failed && xhr.status == 0 && !xhr.responseText && EXISTS)) // opera
				false)
			{
				continue;
			}
			if (!(baseMod in modulePathCache)) {
				modulePathCache[baseMod] = cachePath;
			}
			return {src: xhr.responseText, location: path};
		}
		throw new Error("Module not found: " + pathString + " (looked in " + paths.join(', ') + ")");
	}
	
	module.__path = window.location.toString();
	module.basePath = module.path[module.path.length-1];
	var modules = {log: log, module:module};
	
	function makeAbsoluteURL(url, location) {
		if (/^[A-Za-z]*:\/\//.test(url)) { return url; } // already absolute
		var prefix = location.protocol + '//' + location.host;
		if (url.charAt(0) == '/') { return prefix + url; }
		var regex = new RegExp('\/*(.*?\/?)\/*$');
		var result = location.pathname.match(regex);
		var parts = result ? result[1].split('/') : [];
		parts.pop();
		
		var urlParts = url.split('/');
		while(true) {
			if(urlParts[0] == '.') {
				urlParts.shift();
			} else if(urlParts[0] == '..') {
				urlParts.shift(); parts.pop();
			} else {
				break;
			}
		}

		var pathname = parts.join('/');
		if(pathname) pathname += '/';
		return prefix + '/' + pathname + urlParts.join('/');
	}
	
	function resolveRelativePath(pkg, path) {
		if(pkg.charAt(0) == '.') {
			pkg = pkg.substring(1);
			var segments = path.split('.');
			while(pkg.charAt(0) == '.') {
				pkg = pkg.slice(1);
				segments.pop();
			}
			
			var prefix = segments.join('.');
			if (prefix) {
				return prefix + '.' + pkg;
			}
		}
		return pkg;
	}
	
	/* the actual module function object
	 ***********************************/
	function _moduleImport(context, path, what) {
		// parse the what statement
		var match, imports = [];
		if((match = what.match(/^(from|external)\s+([\w.$]+)\s+import\s+(.*)$/))) {

			imports[0] = {from: resolveRelativePath(match[2], path), external: match[1] == 'external', "import": {}};
			match[3].replace(/\s*([\w.$*]+)(?:\s+as\s+([\w.$]+))?/g, function(_, item, as) {
				imports[0]["import"][item] = as || item;
			});
		} else if((match = what.match(/^import\s+(class )?(.*)$/))) {
			var isClassImport = match[1];
			match[2].replace(/\s*([\w.$]+)(?:\s+as\s+([\w.$]+))?,?/g, function(_, pkg, as) {
				fullPkg = resolveRelativePath(pkg, path);
				imports[imports.length] = {from: fullPkg, as: (as ? as : pkg), single: isClassImport };
			});
		} else {
			if(SyntaxError) {
				throw new SyntaxError(what);
			} else {
				throw new Error("Syntax error: " + what);
			}
		}
		
		// import each item in the what statement
		for(var i = 0, item, len = imports.length; (item = imports[i]) || i < len; ++i) {
			var pkg = item.from;
			
			// eval any packages that we don't know about already
			var segments = pkg.split('.');
			if(!(pkg in modules)) {
				try {
					var result = getModuleSourceAndPath(pkg);
				} catch(e) {
					log('Error:', context.module.__path, 'could not execute: "' + what + '"');
					throw e;
				}
				var newRelativePath = segments.slice(0, segments.length - 1).join('.');
				if(!item.external) {
					var newContext = {
						exports: {},
						global: window
					};
					newContext.module = bind(this, _moduleImport, newContext, newRelativePath);
					for(var j in modules.module) {
					    newContext.module[j] = modules.module[j];
					}
					
					// TODO: FIX for "trailing ." case
					var tmp = result.location.split('/');
					newContext.module.__dir = tmp.slice(0,tmp.length-1).join('/');
					newContext.module.__path = result.location;
					compile(newContext, result);
					modules[pkg] = newContext.exports;
				} else {
					var newContext = {};
					for(var j in item["import"]) {
						newContext[j] = undefined;
					}
					windowCompile(newContext, result);
					modules[pkg] = newContext;
					for(var j in item["import"]) {
						if(newContext[j] === undefined) {
							newContext[j] = window[j];
						}
					}
				}
			}
			
			if(item.as) {
				// remove trailing/leading dots
				var segments = item.as.match(/^\.*(.*?)\.*$/)[1].split('.');
				var c = context;
				for(var k = 0, slen = segments.length - 1, segment; (segment = segments[k]) && k < slen; ++k) {
					if(!segment) continue;
					if (!c[segment]) { c[segment] = {}; }
					c = c[segment];
				}
				c[segments[slen]] = modules[pkg];
				if (item.single) {
					var className = pkg.split('.').pop();
					c[segments[slen]] = c[segments[slen]][className];
				}
			} else if(item["import"]) {
				if(item["import"]['*']) {
					for(var k in modules[pkg]) { context[k] = modules[pkg][k]; }
				} else {
					try {
						for(var k in item["import"]) { context[item["import"][k]] = modules[pkg][k]; }
					} catch(e) {
						log('module: ', modules);
						throw e;
					}
				}
			}
		}
		
	}
})();