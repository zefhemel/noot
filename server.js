var http = require('http'),
    httpProxy = require('http-proxy'),
    request = require("request");

var AUTH = "relatoc";

var handlers = [];
var requestCount = 0;

httpProxy.createServer(function(req, res, proxy) {
    var parsed = require("url").parse(req.url, true);
    
    if(parsed.pathname === "/$api/register") {
        if(req.headers.auth !== AUTH) {
            res.writeHead(500);
            res.end("Not allowed");
            return;
        }
        handlers.push(parsed.query);
        res.writeHead(200);
        res.end("OK");
        return;
    }
    
    var handler = handlers[requestCount++ % handlers.length];

    proxy.proxyRequest(req, res, handler);
}).listen(8000);

function createServer(port, onConnect, callback) {
    try {
        http.createServer(onConnect).listen(port);
    } catch(e) {
        return callback(e);
    }

    request({
        url: "http://localhost:8000/$api/register",
        qs: {
            host: "localhost",
            port: port
        },
        headers: {
            auth: AUTH
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200)
            callback();
        else
            callback({error: error, response: response, body: body});
    });
}

createServer(9000, function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.write('request successfully proxied: ' + req.url + ', to: first');
    res.end();
}, function(err) {
    if(err) {
        return console.error("Error", err);
    }
    console.log("Listenin'");
});

createServer(9001, function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.write('request successfully proxied: ' + req.url + ', to: second');
    res.end();
}, function(err) {
    if(err) {
        return console.error("Error", err);
    }
    console.log("Listenin'");
});

createServer(9003, function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.write('request successfully proxied: ' + req.url + ', to: third');
    res.end();
}, function(err) {
    if(err) {
        return console.error("Error", err);
    }
    console.log("Listenin'");
});