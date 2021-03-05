var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Offset = kafka.Offset;
var Client = kafka.KafkaClient;
var topic = 'notiDataForUseInDocker';

var client = new Client({ kafkaHost: 'localhost:9092' });
var topics = [{ topic: topic, partition: 0 }];
var options = { groupId: 'kafka-nodejs-group',
				autoCommit: false, 
				fetchMaxWaitMs: 5000,
				fetchMinBytes: 1,
        fetchMaxBytes: 104857600
      };//100MB
        
var consumer = new Consumer(client, topics, options);

var offset = new Offset(client);

const timeWindow = 300000; //5min
//============================================================
 var count = 0;
console.time("time_check")
consumer.on('message', function (message) {

  count++;
  
  console.log("count: ", count);
  if(count == 100000){
      console.timeEnd("time_check");
      console.log("count: ", count);
      }

}); 


consumer.on('error', function (err) {
  console.log('error', err);
});

