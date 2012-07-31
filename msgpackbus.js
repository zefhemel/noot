var net = require("net");
var msgpack = require("msgpack-js");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function MsgPackConnection(args) {
    var self = this;
    
    this.socket = net.createConnection.apply(net, arguments);
    this.socket.on("data", deFramer(function(frame) {
        self.emit("message", msgpack.decode(frame));
    }));
}

exports.MsgPackConnection = MsgPackConnection;

util.inherits(MsgPackConnection, EventEmitter);

MsgPackConnection.prototype.send = function(message) {
    var frame = msgpack.encode(message);
    
    var header = new Buffer(4);
    header.writeUInt32BE(frame.length, 0);
    this.socket.write(header);
    this.socket.write(frame);
};

function MsgPackServer(args) {
    var self = this;
    
    var nextClientId = 0;
    
    this.connections = {};
    
    this.server = net.createServer(function(conn) {
        var clientId = nextClientId++;
        self.connections[clientId] = conn;
        
        conn.on("data", deFramer(function(frame) {
            self.emit("message", clientId, msgpack.decode(frame));
        }));
        conn.on("end", function() {
            delete self.connections[clientId];
        });
    });
    
    this.server.listen.apply(this.server, arguments);
}

exports.MsgPackServer = MsgPackServer;

util.inherits(MsgPackServer, EventEmitter);

MsgPackServer.prototype.send = function(clientId, message) {
    var socket = this.connections[clientId];
    
    if(!socket)
        return -1;
        
    var frame = msgpack.encode(message);
    
    var header = new Buffer(4);
    header.writeUInt32BE(frame.length, 0);
    socket.write(header);
    socket.write(frame);
};

MsgPackServer.prototype.close = function() {
    this.server.close();
};

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
