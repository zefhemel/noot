var request = require("request");
var assert = require("assert");

module.exports = function startup(options, imports, register) {
    
    assert(options.registryUrl, "Option 'registryUrl' is required.");
    assert(options.registryUrl, "Option 'registryUrl' is required.");
    
    var connect = imports.connect;
    
    var host = connect.getHost();
    var port = connect.getPort();
    
    request({
        url: options.registryUrl + "/$api/register",
        qs: {
            host: host,
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
    
    register();
    
};