const kafka = require('kafka-node')
const express = require('express');
const app = express();
const moment = require('moment-timezone'); 
moment.tz.setDefault("UTC"); 

const port = 7980;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Producer = kafka.Producer,
   client = new kafka.KafkaClient(),
   producer = new Producer(client);

producer.on('ready', function () {
    console.log('Producer is on ready');
});

var topic = 'multiThread';//TwoAEpairsNotifi, notiTopic

const SEND_COUNT = 10;
//var data_count = 0;
async function Emulator() {
   for(var i=0; i<SEND_COUNT; i++){
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
                  } 

      var fullBody = JSON.stringify(ntelsData);
      //console.log("fullBody: ", typeof(fullBody), fullBody)
      let payloads = [{ topic: topic, messages: fullBody, partition: 0 }];
         
      producer.send(payloads, function (err, data) {
         console.log(data);
      })
      
      //await sleep(1000);
   }
   
}

Emulator();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
const j, k;
for(j=1;j<=10;j+=2)
	
for(k=2;k<=10;k+=2)
	
짝수면 partition 0에
홀수면 partition 1에
 
producer.send를 두 개 실행하면?

**/

