#!/usr/bin/env node

var architect = require("architect");
var config = process.argv[2] || "worker";

architect.createApp(architect.resolveConfig(require("./configs/" + config), __dirname + "/plugins"), function (err, app) {
   if (err) {
       console.error("While starting");
       throw err;
   }
   console.log("Started!");
});


