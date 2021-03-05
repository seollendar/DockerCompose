const kafka = require('kafka-node')
const express = require('express');
const moment = require('moment');
const app = express();

const port = 5007;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const Producer = kafka.Producer,
   client = new kafka.KafkaClient(),
   producer = new Producer(client);

producer.on('ready', function () {
    console.log('Producer is on ready');
});

var topic = 'notifi';
// ================================================================

app.post('/Preprocessing', function(req, res){

	var fullBody = '';
	req.on('data', function(chunk) {
		fullBody += chunk; 
	});

	req.on('end', function(){
		// res.status(200).send('done');

		var jsonbody = JSON.parse(fullBody);
		let cinContents = jsonbody['m2m:sgn'].nev.rep['m2m:cin'].con;
		var sentMessage = JSON.stringify(cinContents);				
		let payloads = [{ topic: topic, messages: sentMessage, partition: 0 }];
			
		producer.send(payloads, function (err, data) {
			console.log(data, Date.now());
		});

						
		res.status(200).send('done');
	});
	
	
});
