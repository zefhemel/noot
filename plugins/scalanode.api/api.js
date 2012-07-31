var assert = require("assert");
var httpProxy = require("http-proxy");
httpProxy.setMaxSockets(100000);

var proxy = new httpProxy.RoutingProxy();

proxy.on("proxyError", function(err, req, res) {
    console.error("Could not proxy request " + req.headers.host + req.url + " -> " + res.$host + ":" + res.$port);
});

var AUTH = "relatoc";

module.exports = function startup(options, imports, register) {
    assert(options.authKey, "Option 'authKey' is required.");
    
    var connect = imports.connect;
    var scalanode = imports.scalanode;
    
    connect.useMain(adminHandler());
    
    function adminHandler() {
        return function(req, res, next) {
            if(req.parsedUrl.pathname === "/$api/register") {
                if (req.headers.auth !== AUTH) {
                    res.writeHead(500);
                    res.end("Not allowed");
                    return;
                }
                scalanode.registerHandler(req.parsedUrl.query.host);
                res.writeHead(200);
                res.end("OK");
            }
            else
                next();
        };
    }

};