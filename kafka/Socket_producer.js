// const redis = require('redis');
// client = redis.createClient(6379, '127.0.0.1');
// var count=0;

var net = require('net');
var server = net.createServer(function(socket) {
	// connection event
	console.time('CHECK')
	console.log('클라이언트 접속');
	
	socket.write('Welcome to Socket Server');

	socket.on('data', function(chunk) {
		console.log('클라이언트가 보냄 : ',chunk.toString());	
				
		//var sentMessage = JSON.stringify(cinContents);
		
		var kafka = require('kafka-node'),
			Producer = kafka.Producer,
			KeyedMessage = kafka.KeyedMessage,
			client = new kafka.KafkaClient(),
			producer = new Producer(client),
			
			payloads = [{ topic: 'topic_chunk', messages: chunk, partition: 0 }];
			
		producer.on('ready', function () {
			producer.send(payloads, function (err, data) {
				console.log(data);
			});
		});
		
	});
	
	socket.on('end', function() {
		console.timeEnd('CHECK')
		console.log('클라이언트 접속 종료');		
	});
});

server.on('listening', function() {
	console.log('Server is listening');
});

server.on('close', function() {
	console.log('Server closed');
});

server.listen(8000);