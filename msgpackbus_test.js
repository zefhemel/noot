var msgpackbus = require("./msgpackbus");
var assert = require("assert");

module.exports = {
    "test in order receiving of messages": function(next) {
        var server = new msgpackbus.MsgPackServer(1331);
        var receivedCount = 0;
        server.on("message", function(clientId, message) {
            assert.equal(message.n, receivedCount);
            receivedCount++;
            if(receivedCount === 10) {
                server.close();
                next();
            }
        });

        var client = new msgpackbus.MsgPackConnection(1331);
        for (var i = 0; i < 10; i++) {
            client.send({
                name: "Zef",
                n: i
            });
        }
    }
};

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}