module.exports = [{
        packagePath: "connect-architect/connect",
        host: "localhost",
        port: [8001, 8100]
    },
    {
        packagePath: "./scalanode.worker",
        registryUrl: "http://localhost:7998"
    },
    "./scalanode.worker.sample",
    "architect/plugins/architect.log"
];