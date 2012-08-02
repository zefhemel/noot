var net = require("net");
var msgpack = require("msgpack-js");
var assert = require("assert");
var EventEmitter = require("events").EventEmitter;

module.exports = function startup(options, imports, register) {
    assert(options.port, "Option 'port' is required.");
    
    var nextClientId = 0;
    var connections = {};
    var events = {}; // name -> {clientId: true}
    
    var localEmitter = new EventEmitter();
    
    var server = net.createServer(function(conn) {
        var clientId = nextClientId++;
        connections[clientId] = conn;
        conn.subscribedEvents = {};
        
        conn.on("data", deFramer(function(frame) {
            onMessage(clientId, msgpack.decode(frame));
        }));
        conn.on("end", function() {
            Object.keys(connections[clientId].subscribedEvents).forEach(function(eventName) {
                removeListener(clientId, eventName);
            });
            delete connections[clientId];
        });
    }).listen(options.port);
    
    console.log("Listening on port", options.port);
    
    function addListener(clientId, eventName) {
        if(!events[eventName])
            events[eventName] = {};
        
        events[eventName][clientId] = true;
        connections[clientId].subscribedEvents[eventName] = true;
        console.log("Added listener:", clientId, eventName);
    }
    
    function removeListener(clientId, eventName) {
        if(!events[eventName])
            return;
        
        delete events[eventName][clientId];
        delete connections[clientId].subscribedEvents[eventName];
        console.log("Removed listener:", clientId, eventName);
    }
    
    function emit(eventName, data) {
        // Broadcast to all subscribers
        var subscribers = Object.keys(events[eventName] || {});
        var message = {event: eventName, data: data};
        subscribers.forEach(function(clientId) {
            send(clientId, message);
        });
        // Dispatch locally
        localEmitter.emit(eventName, data);
        console.log("Emitted:", eventName, data);
    }
    
    function onMessage(clientId, message) {
        var eventName = message.event;
        var data = message.data;
        if(eventName === "$addListener")
            addListener(clientId, data);
        else if(eventName === "$removeListener")
            removeListener(clientId, data);
        else
            emit(eventName, data);
    }
        
    function send(clientId, message) {
        var socket = connections[clientId];
        
        if(!socket)
            return -1;
            
        var frame = msgpack.encode(message);
        
        var header = new Buffer(4);
        header.writeUInt32BE(frame.length, 0);
        socket.write(header);
        socket.write(frame);
    }
    
    function close() {
        server.close();
    }
    
    function deFramer(onFrame) {
        var buffer;
        var state = 0;
        var length = 0;
        var offset;
        return function parse(chunk) {
            for (var i = 0, l = chunk.length; i < l; i++) {
                switch (state) {
                case 0: length |= chunk[i] << 24; state = 1; break;
                case 1: length |= chunk[i] << 16; state = 2; break;
                case 2: length |= chunk[i] << 8; state = 3; break;
                case 3: length |= chunk[i]; state = 4;
                    buffer = new Buffer(length);
                    offset = 0;
                    break;
                case 4:
                    var len = l - i;
                    var emit = false;
                    if (len + offset >= length) {
                        emit = true;
                        len = length - offset;
                    }
                    // TODO: optimize for case where a copy isn't needed can a slice can
                    // be used instead?
                    chunk.copy(buffer, offset, i, i + len);
                    offset += len;
                    i += len - 1;
                    if (emit) {
                        onFrame(buffer);
                        state = 0;
                        length = 0;
                        buffer = undefined;
                        offset = undefined;
                    }
                    break;
                }
            }
        };
    }
    
    localEmitter.remoteEmit = emit;
    
    register(null, {
        "scalanode.eventbus.server": localEmitter
    });
    
};