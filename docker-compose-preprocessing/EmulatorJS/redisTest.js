var redis = require("redis"),
   client = redis.createClient(6379, "redis");

client.on("error", function (err) {
   console.log("Error " + err);
});

client.set("hello", "hi Node.js");

client.get("hello", function (err, val) {
   console.log(val);
   client.quit();
});
