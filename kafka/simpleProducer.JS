
const kafka = require('kafka-node')
const express = require('express');
const moment = require('moment');
const app = express();

const port = 5008;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Producer = kafka.Producer,
   client = new kafka.KafkaClient(),
   producer = new Producer(client);

producer.on('ready', function () {
    console.log('Producer is on ready');
});

var topic = 'flowData5';
// ================================================================

var SEND_COUNT = 50000;
console.time('set');

function sendTokafka(){
	
	for(var i=0; i<SEND_COUNT; i++){

	   // let sentMessage = {
		 // "m2m:sgn": {
		  // "nev": {
			// "rep": {
			 // "m2m:cin": {
			   // "cnf": "application/json",
			   // "con": {
				// "i": i,
				// "ae": `y8`,
				// "container": "location",
				// "wtime": moment().valueOf(),
				// "lat": 37.459644+(i*0.001),
				// "lng": 127.561136
			   // }
			 // }
			// }
		  // }
		 // }
	   // }
		let cinContents = {
			"i": i,
			"ae": `y10`,
			"container": "location",
			"wtime": moment().valueOf(),
			"lat": 37.459644+(i*0.001),
			"lng": 127.561136
		}
		
		var sentMessage = JSON.stringify(cinContents);				
		let payloads = [{ topic: topic, messages: sentMessage, partition: 0 }];
			
		producer.send(payloads, function (err, data) {
			//console.log(data, Date.now());
		});

	}
	console.timeEnd('set');

}

sendTokafka();


