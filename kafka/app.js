
const express = require('express');
const app = express();

const port = 5005;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));


// ================================================================

app.post('/Preprocessing', function(req, res){

	var fullBody = '';
	req.on('data', function(chunk) {
		fullBody += chunk; 
	});

	req.on('end', async function(){
		// res.status(200).send('done');

		var jsonbody = JSON.parse(fullBody);
		let cinContents = jsonbody['m2m:sgn'].nev.rep['m2m:cin'].con;
		// console.log('cinContents: ', cinContents);
		var sentMessage = JSON.stringify(cinContents);
		
		var kafka = require('kafka-node'),
			Producer = kafka.Producer,
			KeyedMessage = kafka.KeyedMessage,
			client = new kafka.KafkaClient(),
			producer = new Producer(client),
			
			payloads = [{ topic: 'topic5', messages: sentMessage, partition: 0 }];
			
		producer.on('ready', function () {
			producer.send(payloads, function (err, data) {
				console.log(data);
			});
		});

						
		res.status(200).send('done');
	});
	
	
});


const kafka = require('kafka-node');
Producer = kafka.Producer;
KeyedMessage = kafka.KeyedMessage;

const express = require('express');
const app = express();

const port = 5005;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

// ================================================================

app.post('/Preprocessing', function(req, res){

	var fullBody = '';
	req.on('data', function(chunk) {
		fullBody += chunk; 
	});

	req.on('end', async function(){
		// res.status(200).send('done');

		var jsonbody = JSON.parse(fullBody);
		let cinContents = jsonbody['m2m:sgn'].nev.rep['m2m:cin'].con;
		// console.log('cinContents: ', cinContents);
		var sentMessage = JSON.stringify(cinContents);
		
		var	client = new kafka.KafkaClient(),
			producer = new Producer(client),
			payloads = [{ topic: 'topic4', messages: sentMessage, partition: 0 }];
			
		producer.on('ready', function () {
			// console.time("Set");
			producer.send(payloads, function (err, data) {				
				if(err) {
					console.log(err);
				}
				console.log(data);
			});
			// console.timeEnd("Set");
		});

						
		res.status(200).send('done');
	});
	
	
});




