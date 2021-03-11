const kafka = require("kafka-node");
const moment = require("moment-timezone");
moment.tz.setDefault("UTC");

const Producer = kafka.Producer,
   client = new kafka.KafkaClient({ kafkaHost: "kafka:9092" }),
   producer = new Producer(client);

producer.on("ready", function () {
   console.log("Producer is on ready");
});

var partitionNum;

var topic = "partition5Topic"; //TwoAEpairsNotifi, notiTopic
const SEND_COUNT = 50000; //50000 100000

function Emulator() {
   for (var i = 0; i < SEND_COUNT; i++) {
      if (i % 5 == 0) {
         partitionNum = 0;
      } else if (i % 5 == 1) {
         partitionNum = 1;
      } else if (i % 5 == 2) {
         partitionNum = 2;
      } else if (i % 5 == 3) {
         partitionNum = 3;
      } else {
         partitionNum = 4;
      }

            let ntelsData = {
                    "m2m:sgn": {
                     "nev": {
                       "rep": {
                        "m2m:cin": {
                          "ty": 4,
                          "ri": "cin00S02f9ecfd6-35ef-451e-8672-09ab3ec09a141603350091457",
                          "rn": "cin-S02f9ecfd6-35ef-451e-8672-09ab3ec09a141603350091457",
                          "pi": "cnt00000000000001951",
                          "ct": "20201022T160131",
                          "lt": "20201022T160131",
                          "et": "20201121T160131",
                          "st": 903335,
                          "cr": "SS01228427453",
                          "cnf": "application/json",
                          "cs": 155,
                          "con": {
                           "i": i,  
                           //"latitude": 37.411360 + (i*0.0001),
						   //"longitude": 127.129459 + (i*0.0001),
						   "latitude": 37.411360,
                           "longitude": 127.129459,
                           "altitude": 12.934,
                           "velocity": 0,
                           "direction": 0,
                           "time": moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
                           "position_fix": 1,
                           "satelites": 0,
                           "state": "ON"
                          }
                        }
                       },
                       "om": {
                        "op": 1,
                        "org": "SS01228427453"
                       }
                     },
                     "vrq": false,
                     "sud": false,
                     "sur": `/~/CB00061/smartharbor/D${i}/scnt-location/sub-S01228427453_user`,
					 //"sur": "/~/CB00061/smartharbor/dt1/scnt-location/sub-S01228427453_user",
                     "cr": "SS01228427453"
                    }
                  };

      var fullBody = JSON.stringify(ntelsData);
      let payloads = [{ topic: topic, messages: fullBody, partition: partitionNum }];

      producer.send(payloads, function (err, data) {
         console.log(data);
      });
   }
}

Emulator();

// if(i%3 == 0){
//   partitionNum = 0
// }else if(i%3 == 1){
//   partitionNum = 1
// }else{
//   partitionNum = 2
// }

// if(i%4 == 0){
//   partitionNum = 0
// }else if(i%4 == 1){
//   partitionNum = 1
// }else if(i%4 == 2){
//   partitionNum = 2
// }else{
//   partitionNum = 3
// }

// if(i%5 == 0){
//   partitionNum = 0
// }else if(i%5 == 1){
//   partitionNum = 1
// }else if(i%5 == 2){
// partitionNum = 2
// }else if(i%5 == 3){
//   partitionNum = 3
// }else{
//   partitionNum = 4
// }

// if(i%6 == 0){
// partitionNum = 0
// }else if(i%6 == 1){
// partitionNum = 1
// }else if(i%6 == 2){
// partitionNum = 2
// }else if(i%6 == 3){
// partitionNum = 3
// }else if(i%6 == 4){
// partitionNum = 4
// }else{
// partitionNum = 5
// }
