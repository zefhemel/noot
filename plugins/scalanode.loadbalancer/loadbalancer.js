var Agent = require("smith").Agent;
var net = require("net");
var assert = require("assert");
var httpProxy = require("http-proxy");

httpProxy.setMaxSockets(100000);

var proxy = new httpProxy.RoutingProxy();

proxy.on("proxyError", function(err, req, res) {
    console.error("Could not proxy request " + req.headers.host + req.url + " -> " + res.$host);
    res.writeHead(500);
    res.end("Could not proxy request.");
});

module.exports = function startup(options, imports, register) {
    assert(options.registryPort, "option 'registryPort' is required.");
    
    var connect = imports.connect;
    var registry = imports["scalanode.eventbus.client"];
    var handlers = [];
    var requestCount = 0;
    
    registry.on("worker/attach", function(host) {
        console.log("Register", host);
        if(handlers.indexOf(host) !== -1)
            handlers.push(host);
    });
    
    registry.on("worker/detach", function(host) {
        console.log("Unregister", host);
        var idx = handlers.indexOf(host);
        
        if(idx !== -1)
            handlers.splice(idx, 1);
        
    });
    
    registry.on("workers", function(handlers_) {
        handlers = handlers_;
        console.log(handlers);
    });
    
    register();
    
    connect.useMain(function(req, res, next) {
        var handlerHost = handlers[requestCount++ % handlers.length];
        //console.log("Request", requestCount, handlerHost);
        var parts = handlerHost.split(":");
        
        res.$host = handlerHost;
        
        return proxy.proxyRequest(req, res, {
            host: parts[0],
            port: parts[1]
        });
    });
    
    register();
};