var assert = require("assert");
var net = require("net");
var Agent = require('smith').Agent;

module.exports = function startup(options, imports, register) {
    assert(options.workerPort, "Option 'workerPort' is required.");
    assert(options.lbPort, "Option 'lbPort' is required.");
    
    var workerAgents = {};
    var workers = {};
    var workerCounter = 0;
    
    var workerApi = {
        register: function(url, callback) {
            workers[url] = true;
            callback();
        },
        unregister: function(url, callback) {
            delete workers[url];
            callback();
        }
    };
    
    var workerPort = options.workerPort;
    net.createServer(function(socket) {
        var agent = new Agent(workerApi);
        
        agent.connect(socket, function(err, api) {
            if (err) return console.error(err.stack);
            console.log("A new client connected");
        });
        
        agent.on("disconnect", function(err) {
            delete workerAgents[agent.id];
            console.error("Worker", agent.id, "disconnected");
            if (err) console.error(err.stack);
        });
        
        agent.id = workerCounter;
        workerAgents[workerCounter] = agent;
        workerCounter++;
    }).listen(workerPort, function() {
        console.log("Worker registry is listening on port", workerPort);
        register();
    });    
    
};