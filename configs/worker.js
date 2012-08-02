module.exports = [{
        packagePath: "connect-architect/connect",
        host: "localhost",
        port: [8001, 8100]
    }, {
        packagePath: "./eventbus.msgpack.client",
        host: "localhost",
        port: 7999
    },
    "./scalanode.worker",
    "./scalanode.worker.sample",
    "architect/plugins/architect.log"
];