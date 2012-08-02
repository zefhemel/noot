var assert = require("assert");
var bouncy = require('bouncy');

module.exports = function startup(options, imports, register) {
    assert(options.registryPort, "option 'registryPort' is required.");
    assert(options.port, "option 'port' is required.");
    
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
    
    bouncy(function (req, bounce) {
        var handlerHost = handlers[requestCount++ % handlers.length];
        console.log("Request", requestCount, handlerHost);
        var parts = handlerHost.split(":");
        bounce(parts[0], +parts[1]);
    }).listen(options.port);
    
    register();
};