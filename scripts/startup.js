var vertx = require('vertx')

vertx.createHttpServer().requestHandler(function(req) {
  var filename = "../app/" + (req.uri() == "/" ? "index.html" :  req.uri());
  req.response.sendFile(filename)
}).listen(8081)
var container = require('vertx/container');
var console = require('vertx/console');
var conf = {
  "web_server": {
    "port": 8082
  },
  "realtime_channel": {
    "port": 8080
  },
  "realtime_search": {
    "address": "realtime.search"
  },
  "elasticsearch": {
    "transportAddresses": [{"host": "data.goodow.com", "port": 9300}],
    "cluster_name": "elasticsearch",
    "client_transport_sniff": true
  },
  "redis": {
    "address": "redis.pub",
    "host": "data.goodow.com",
    "port": 6379
  },
  "callback": {
    "distance_overflow": "你的设备被锁定，请回到首次使用地点，或者联系服务电话: xxx-xxxx"
  }
}
container.deployModule("com.goodow.drive~drive-server~0.1.0-SNAPSHOT", conf, 1, function(err, deploymentID) {
  if (err) {
    console.log("Failed to deploy: " + err);
  } else {
    console.log("This gets called when deployment is complete, deployment id is " + deploymentID);
  }
});
console.log("Deploying Complete!");
