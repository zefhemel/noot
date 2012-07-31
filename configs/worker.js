module.exports = [{
        packagePath: "connect-architect/connect",
        host: "localhost",
        port: [8001, 8100]
    }, {
        packagePath: "./scalanode.worker",
        registryHost: "localhost",
        registryPort: 7999
    },
    "./scalanode.worker.sample",
    "architect/plugins/architect.log"
];