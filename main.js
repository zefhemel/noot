#!/usr/bin/env node

var architect = require("architect");

architect.createApp(architect.resolveConfig(require("./configs/default"), __dirname + "/plugins"), function (err, app) {
   if (err) {
       console.error("While starting");
       throw err;
   }
   console.log("Started!");
});


