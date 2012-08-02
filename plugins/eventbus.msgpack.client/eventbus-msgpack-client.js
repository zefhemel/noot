var net = require("net");
var msgpack = require("msgpack-js");
var assert = require("assert");

module.exports = function startup(options, imports, register) {
    assert(options.host, "Option 'host' is required.");
    assert(options.port, "Option 'port' is required.");
    
    var socket = net.createConnection(options.port, options.host);
    
    socket.on("data", deFramer(function(frame) {
        onEvent(msgpack.decode(frame));
    }));
    
    var events = {}; // eventName -> [callback]
    
    function onEvent(message) {
        var eventName = message.event;
        var data = message.data;
        var subscribers = events[eventName] || [];
        subscribers.forEach(function(callback) {
            callback(data);
        });
    }
    
    var api = {
        addListener: function(eventName, callback) {
            if(!events[eventName]) {
                events[eventName] = [];
            }
            
            // Only send subscription once
            if(events[eventName].length === 0) {
                send({
                    event: "$addListener",
                    data: eventName
                });
            }
            events[eventName].push(callback);
        },
        removeListener: function(eventName, callback) {
            var callbacks = events[eventName];
            var idx = callback.indexOf(callback);
            
            if(idx !== -1)
                callback.splice(idx, 1);
            
            // Only unsubscribe remotely when there's no local listeners
            if(callbacks.length === 0) {
                send({
                    event: "$removeListener",
                    data: eventName
                });
            }
        },
        emit: function(eventName, data) {
            send({
                event: eventName,
                data: data
            });
        },
        close: close
    };
    
    api.on = api.addListener;
    
    function send(message) {
        var frame = msgpack.encode(message);
        
        var header = new Buffer(4);
        header.writeUInt32BE(frame.length, 0);
        socket.write(header);
        socket.write(frame);
    }
    
    function close() {
        socket.close();
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

    register(null, {
        "scalanode.eventbus.client": api
    });
    
};