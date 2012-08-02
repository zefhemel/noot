var fs = require("fs");
var request = require("request");
var assert = require("assert");

module.exports = function startup(options, imports, register) {
    var connect = imports.connect;
    
    assert(options.registryUrl, "Option 'registryUrl' is required.");
    var registryUrl = options.registryUrl;
    
    var host = connect.getHost();
    var port = connect.getPort();
    
    var iid = host + ":" + port;
    
    apiCall(registryUrl + "/register", {host: iid}, function(err) {
        if (err)
            console.error(err);
    });
    
    register(null, {
        "scalanode.worker": {}
    });
    
    return;
    setTimeout(function() {
        var allLoadedFiles = Object.keys(require("module")._cache);
        allLoadedFiles.forEach(function(path) {
            fs.watchFile(path, {persistent: true, interval: 1000}, checkChanges);
        });
        
        function checkChanges(curr, prev) {
            if(curr.mtime !== prev.mtime) {
                console.log("Some file has changed, shutting down.");
                apiCall(registryUrl + "/unregister", {host: iid}, function() {
                    process.exit(5);
                });
            }
        }
    }, 500);
};

function apiCall(url, query, callback) {
    request({
        url: url,
        qs: query
        //headers: { auth: AUTH
    }, function(error, response, body) {
        if (!error && response.statusCode == 200)
            callback();
        else
            callback({error: error, response: response, body: body});
    });
}