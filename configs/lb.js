module.exports = [
  {
      packagePath: "connect-architect/connect",
      host: "0.0.0.0",
      port: 8000
  },
  {
        packagePath: "./eventbus.msgpack.client",
        host: "localhost",
        port: 7999
  },
  {
      packagePath: "./scalanode.loadbalancer",
      registryPort: 7998
  },
  "architect/plugins/architect.log",
];