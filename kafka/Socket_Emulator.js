/*Socket - client*/

var net = require('net');
var ip = '127.0.0.1';
var port = 8000;

var socket = new net.Socket();
socket.connect({host:ip, port:port}, function() {
	console.log('서버와 연결 성공');
	
	console.time('CHECK')
	for(i=0; i<100000; i++){
		//socket.write('Hello Socket Server' + i + '\n');
		socket.write('Hello Socket Server\n');
	}
	console.timeEnd('CHECK')

    socket.end();

    socket.on('data', function(chunk) {
        console.log('서버가 보냄 : ', chunk.toString());        
    });

    socket.on('end', function() {
        console.log('서버 연결 종료');
    });
});