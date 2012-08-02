var url = require("url");

module.exports = function startup(options, imports, register) {
    var eventEmitter = imports["scalanode.eventbus.server"];
    var connect = imports.connect;
    
    connect.use(apiHandler);
    
    var workers = {};

    eventEmitter.on("lb/attach", function(iid) {
        // Let's broadcast all workers so that the new lb knows about them
        broadcastWorkers();
    });
    
    setInterval(broadcastWorkers, 5000);
    
    function broadcastWorkers() {
        eventEmitter.remoteEmit("workers", Object.keys(workers));
    }
    
    function apiHandler(req, res, next) {
        var parsedUrl = url.parse(req.url, true);
        switch(parsedUrl.pathname) {
            case "/register":
                var host = parsedUrl.query.host;
                eventEmitter.remoteEmit("worker/attach", host);
                workers[host] = true;
                console.log("Attached worker", host);
                res.writeHead(200);
                res.end("OK");
                break;
            case "/unregister":
                var host = parsedUrl.query.host;
                delete workers[host];
                console.log("Detached worker", host);
                res.writeHead(200);
                res.end("OK");
                break;
            default:
                next();
        }
    }
};