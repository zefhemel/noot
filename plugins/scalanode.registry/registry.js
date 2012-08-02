
module.exports = function startup(options, imports, register) {
    
    var eventEmitter = imports["scalanode.eventbus.server"];
    
    var workers = {};

    eventEmitter.on("worker/attach", function(iid) {
        workers[iid] = true;
        console.log("Attached worker", iid);
    });
    eventEmitter.on("worker/detach", function(iid) {
        delete workers[iid];
        console.log("Detached worker", iid);
    });

    eventEmitter.on("lb/attach", function(iid) {
        // Let's broadcast all workers so that the new lb knows about them
        broadcastWorkers();
    });
    
    setInterval(broadcastWorkers, 5000);
    
    function broadcastWorkers() {
        eventEmitter.remoteEmit("workers", Object.keys(workers));
    }
};