jsio('from common.javascript import Class');

var logger = logging.getLogger('server.Database');
logger.setLevel(0);


exports = Class(function() {
	
	this.init = function(http) {
		this._host = '127.0.0.1', port = 5984;
		this._client = http.createClient(port, this._host);
	}
	
	// this.createItem = function(properties, callback) {
	// 	this._getUUID(function(id) {
	// 		this._request('PUT', id, properties, callback);
	// 	})
	// }
	
	this.getItemData = function(id, callback) {
		this._request('GET', id, callback);
	}
	
	this.storeItemData = function(item, callback) {
		this._request('PUT', item.getId(), { data: JSON.stringify(item.asDatabaseObject()) }, callback);
	}
	
	this._request = function(verb, id, /* optional */ headers, responseCallback) {
		if (!responseCallback) { 
			responseCallback = headers;
			headers = {};
		}
		var path = '/items/' + id;
		logger.log('_request', verb, path, JSON.stringify(headers));
		
		headers.host = this._host;
		var request = this._client[verb.toLowerCase()](path, headers);
		request.finish(function (response) {
			response.setBodyEncoding("utf8");
			response.addListener("body", function(chunk){
				logger.log("received properties for item", id);
				responseCallback(JSON.parse(chunk));
			});
		});
	}
	
	// this._getUUID = function(callback) {
	// 	this._request('GET', '_uuids', callback);
	// }
	
})