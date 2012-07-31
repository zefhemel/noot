var assert = require("assert");
var net = require("net");
var Agent = require('smith').Agent;

module.exports = function startup(options, imports, register) {
    assert(options.workerPort, "Option 'workerPort' is required.");
    assert(options.lbPort, "Option 'lbPort' is required.");
    
    var workerAgents = {};
    var workers = {};
    var workerCounter = 0;
    var lbAgents = {};
    var lbCounter = 0;
    
    setupWorkerApi();
    setupLbApi();
    register();

    function setupWorkerApi() {
        var workerApi = {
            register: function(url, callback) {
                workers[url] = true;
                console.log("Register", url);
                broadcastWorkerRegistered(url);
                callback();
            },
            unregister: function(url, callback) {
                delete workers[url];
                console.log("Unregister", url);
                broadcastWorkerUnregistered(url);
                callback();
            }
        };
        
        var workerPort = options.workerPort;
        net.createServer(function(socket) {
            var agent = new Agent(workerApi);
            
            agent.connect(socket, function(err, api) {
                if (err) return console.error(err.stack);
                console.log("A new worker connected");
            });
            
            agent.on("disconnect", function(err) {
                delete workerAgents[agent.id];
                console.error("Worker", agent.id, "disconnected");
                if (err) console.error(err.stack);
            });
            
            agent.id = workerCounter;
            workerAgents[workerCounter] = agent;
            workerCounter++;
        }).listen(workerPort, "0.0.0.0", function() {
            console.log("Worker registry is listening on port", workerPort);
        });    
    }
    
    function broadcastWorkerRegistered(url) {
        Object.keys(lbAgents).forEach(function(workerId) {
            var agent = lbAgents[workerId];
            var remoteApi = agent.remoteApi;
            remoteApi.registerWorker(url, function(err) {
                if (err)
                    console.error("Error registering worker", url, "with", agent.id, err);
            });
        });
    }
    
    function broadcastWorkerUnregistered(url) {
        Object.keys(lbAgents).forEach(function(workerId) {
            var agent = lbAgents[workerId];
            var remoteApi = agent.remoteApi;
            remoteApi.unregisterWorker(url, function(err) {
                if (err)
                    console.error("Error unregistering worker", url, "with", agent.id, err);
            });
        });
    }

    function setupLbApi() {
        var lbApi = {
            getWorkers: function(callback) {
                callback(null, Object.keys(workers));
            }
        };
        
        var lbPort = options.lbPort;
        net.createServer(function(socket) {
            var agent = new Agent(lbApi);
            
            agent.connect(socket, function(err, api) {
                if (err) return console.error(err.stack);
                console.log("A new lb connected");
            });
            
            agent.on("disconnect", function(err) {
                delete lbAgents[agent.id];
                console.error("LB", agent.id, "disconnected");
                if (err) console.error(err.stack);
            });
            
            agent.id = lbCounter;
            workerAgents[lbCounter] = agent;
            lbCounter++;
        }).listen(lbPort, "0.0.0.0", function() {
            console.log("Load balancer registry is listening on port", lbPort);
        });    
    }
    
};