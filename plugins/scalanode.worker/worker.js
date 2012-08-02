var fs = require("fs");

module.exports = function startup(options, imports, register) {
    var eventDispatcher = imports["scalanode.eventbus.client"];
    
    var connect = imports.connect;
    
    var host = connect.getHost();
    var port = connect.getPort();
    
    var iid = host + ":" + port;
    eventDispatcher.emit("worker/attach", iid);
    
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
                eventDispatcher.emit("worker/detach", iid);
                // No callback for this yet, so let's give it a second (HACK!)
                setTimeout(function() {
                    process.exit(5);
                }, 1000);
            }
        }
    }, 500);
};