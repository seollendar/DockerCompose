const kafka = require('kafka-node');
const bp = require('body-parser');


try {
  // const Consumer = kafka.HighLevelConsumer;
  var Client = kafka.KafkaClient;
  var client = new Client({ kafkaHost: 'localhost:9092' });
  var Consumer = kafka.Consumer;
  let consumer = new Consumer(
    client,
    [{ topic: 'Notification', partition: 0 }],
    {
      autoCommit: true,
      fetchMaxWaitMs: 1000,
      fetchMaxBytes: 1024 * 1024,
      encoding: 'utf8',
      fromOffset: false
    }
  );
  
  var count = 0;
  console.time("time_check")
  consumer.on('message', async function(message) {
  count++;
  // if(count == 100000){
      // console.timeEnd("time_check");
      console.log("count: ", count);
	  console.log("message: ", message);
      // }

  })
  consumer.on('error', function(err) {
    console.log('error', err);
  });
}
catch(e) {
  console.log(e);
}
