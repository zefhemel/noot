module.exports = function startup(options, imports, register) {
    
    var connect = imports.connect;
    
    connect.use(function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.write('request successfully proxied: ' + req.url + ', to: first');
        res.end();
    });

    register();
};