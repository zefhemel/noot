var msgpackbus = require("./msgpackbus");

var server = new msgpackbus.MsgPackServer(1331);
server.on("message", function(clientId, message) {
    console.log("Received", message, "from", clientId);
});

var client = new msgpackbus.MsgPackConnection(1331);
for (var i = 0; i < 100; i++) {
    client.send({name: "Zef", age: i});
}