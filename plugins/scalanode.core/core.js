var url = require("url");
var httpProxy = require("http-proxy");
httpProxy.setMaxSockets(100000);

var proxy = new httpProxy.RoutingProxy();

proxy.on("proxyError", function(err, req, res) {
    console.error("Could not proxy request " + req.headers.host + req.url + " -> " + res.$host + ":" + res.$port);
});

var AUTH = "relatoc";

module.exports = function startup(options, imports, register) {
    var connect = imports.connect;
    
    connect.use(urlParser);
    connect.useMain(proxyHandler());
    
    var handlers = [];
    
    function urlParser(req, res, next) {
        req.parsedUrl = url.parse(req.url, true);
        next();
    }
    
    function proxyHandler() {
        var requestCount = 0;
        
        return function(req, res, next) {
            var handlerHost = handlers[requestCount++ % handlers.length];
            var parts = handlerHost.split(":");
            
            return proxy.proxyRequest(req, res, {
                host: parts[0],
                port: parts[1]
            });
        };
    }
    
    register(null, {
        scalanode: {
            registerHandler: function(handlerHost) {
                handlers.push(handlerHost);
            },
            unregisterHandler: function(handlerHost) {
                var idx = handlers.indexOf(handlerHost);
                if(idx !== -1)
                    handlers.splice(idx, 1);
            }
        }
    });
    
};