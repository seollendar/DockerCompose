

console.log('main.js 시작') 
var ConsumerGroup = require('./ConsumerGroup'); 
console.log('initiateKafkaConsumerGroup() 호출 ' + ConsumerGroup.initiateKafkaConsumerGroup('grouptest','notifiTopic'));
