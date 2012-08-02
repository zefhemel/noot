module.exports = [
  {
        packagePath: "./eventbus.msgpack.client",
        host: "localhost",
        port: 7999
  },
  {
      packagePath: "./scalanode.loadbalancer",
      registryPort: 7998,
      port: 8000
  },
  "architect/plugins/architect.log",
];