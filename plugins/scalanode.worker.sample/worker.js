var http = require("http");
var request = require("request");
var assert = require("assert");

module.exports = function startup(options, imports, register) {
    
    assert(options.proxyUrl, "Have to provide 'proxyUrl' config option");
    assert(options.authKey, "Have to provide 'authKey' config option");
    
    var connect = imports.connect;
    var port = connect.getPort();
    
    request({
        url: options.proxyUrl + "/$api/register",
        qs: {
            host: "localhost",
            port: port
        },
        headers: {
            auth: options.authKey
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200)
            callback();
        else
            callback({error: error, response: response, body: body});
    });
    
    connect.use(function(req, res) {
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

    register();
};