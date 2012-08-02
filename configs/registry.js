module.exports = [
  {
      packagePath: "./eventbus.msgpack.server",
      host: "0.0.0.0",
      port: 7999
  },
  // For the worker API
  {
    packagePath: "connect-architect/connect",
    host: "localhost",
    port: 7998
},
  "./scalanode.registry",
  "architect/plugins/architect.log",
];