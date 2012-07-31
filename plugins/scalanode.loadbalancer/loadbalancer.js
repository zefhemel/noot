var Agent = require("smith").Agent;
var net = require("net");
var assert = require("assert");
var httpProxy = require("http-proxy");

httpProxy.setMaxSockets(100000);

var proxy = new httpProxy.RoutingProxy();

proxy.on("proxyError", function(err, req, res) {
    console.error("Could not proxy request " + req.headers.host + req.url + " -> " + res.$host + ":" + res.$port);
});

module.exports = function startup(options, imports, register) {
    assert(options.registryPort, "option 'registryPort' is required.");
    
    var connect = imports.connect;
    var handlers = [];
    var requestCount = 0;
    
    var api = {
        registerWorker: function(url, callback) {
            console.log("Register", url);
            if(handlers.indexOf(url) !== -1)
                handlers.push(url);
            callback();
        },
        unregisterWorker: function(url, callback) {
            console.log("Unregister", url);
            var idx = handlers.indexOf(url);
            
            if(idx !== -1)
                handlers.splice(idx, 1);
            
            callback();
        }
    };
    
    var agent = new Agent(api);
    var socket = net.connect(options.registryPort, function() {
        agent.connect(socket, function(err, api) {
            api.getWorkers(function(err, workers) {
                console.log("Workers", workers);
                if (err) throw err;
                handlers = workers;
            });
        });
    });
    
    register();
    
    connect.useMain(function(req, res, next) {
        var handlerHost = handlers[requestCount++ % handlers.length];
        var parts = handlerHost.split(":");
        
        return proxy.proxyRequest(req, res, {
            host: parts[0],
            port: parts[1]
        });
    });
    
    register();
};