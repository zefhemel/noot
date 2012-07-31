var assert = require("assert");
var net = require("net");
var Agent = require("smith").Agent;
var fs = require("fs");

module.exports = function startup(options, imports, register) {
    assert(options.registryHost, "Option 'registryHost' is required.");
    assert(options.registryPort, "Option 'registryPort' is required.");
    
    var connect = imports.connect;
    
    var host = connect.getHost();
    var port = connect.getPort();
    
    var iid = host + ":" + port;
    var agent = new Agent();
    var socket = net.connect(options.registryPort, function() {
        agent.connect(socket, function(err, api) {
            api.register(iid, function(err, result) {
                if (err) throw err;
                console.log("Registered worker:", iid);
            });
        });
    });
    
    register(null, {
        "scalanode.worker": {}
    });
    
    setTimeout(function() {
        var allLoadedFiles = Object.keys(require("module")._cache);
        allLoadedFiles.forEach(function(path) {
            fs.watchFile(path, {persistent: true, interval: 1000}, checkChanges);
        });
        
        function checkChanges(curr, prev) {
            if(curr.mtime !== prev.mtime) {
                console.log("Some file has changed, shutting down.");
                agent.remoteApi.unregister(iid, function() {
                    process.exit(5);
                });
            }
        }
    }, 500);
};