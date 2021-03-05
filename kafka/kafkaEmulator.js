const kafka = require('kafka-node')
const express = require('express');
const app = express();
const moment = require('moment-timezone'); 
moment.tz.setDefault("UTC"); 


const port = 4980;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Producer = kafka.Producer,
   client = new kafka.KafkaClient(),
   producer = new Producer(client);

client.setMaxListeners(50);

producer.on('ready', function () {
    console.log('Producer is on ready');
});

var topic = 'fullNotification';
// ================================================================

const SEND_COUNT = 50000;
var data_count = 0;
async function demo() {
	//console.time("set");
	for(var i=0; i<SEND_COUNT; i++){
		//await sleep(1000);

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
									"latitude": 37.4128610+(i*0.001),
									"longitude": 127.1274090,
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
							"sur": "/~/CB00061/smartharbor/dt1/scnt-location/sub-S01228427453_user",
							"cr": "SS01228427453"
						  }
						} 

		var sentMessage = JSON.stringify(ntelsData);
		let payloads = [{ topic: topic, messages: sentMessage, partition: 0 }];
		
		producer.send(payloads, function (err, data) {
			console.log(data);
			// data_count ++;
			// if(data_count == SEND_COUNT){
				//// console.timeEnd("set");
				// console.log("SENT DATA COUNT: ", data_count);
				// console.log(response.status);
			// }
		});
		
	}
	
}

demo();

function sleep(t){
   return new Promise(resolve=>setTimeout(resolve,t));
}


