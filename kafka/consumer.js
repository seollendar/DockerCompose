const redis = require('redis');
Rclient = redis.createClient(6379, '127.0.0.1');
const Influx = require('influx');
const influx = new Influx.InfluxDB('http://admin:password@localhost:8086/preprocessing')

var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Offset = kafka.Offset;
var Client = kafka.KafkaClient;
var topic = 'fullNotification';

var client = new Client({ kafkaHost: 'localhost:9092' });
var topics = [{ topic: topic, partition: 0 }];
var options = { groupId: 'kafka-nodejs-group',
				autoCommit: false, 
				fetchMaxWaitMs: 5000,
				fetchMinBytes: 1,
				fetchMaxBytes: 104857600};//100MB

var consumer = new Consumer(client, topics, options);

var offset = new Offset(client);

const timeWindow = 300000; //5min
//============================================================
 var count = 0;
console.time("time_check")
consumer.on('message', function (message) {
  // var valueInMessage = JSON.parse(message.value);
  // console.log("valueInMessage:  ", valueInMessage)
  // var values = message.value; //Type:String
  // var {ae, lat, lng, wtime} = valueInMessage;

  // Rclient.zadd('sorted_' + ae, wtime, values, function(err, data){
    // if(err){
      // console.log(err);
    // }
  // });  

  // detectInvalidData(ae, values, valueInMessage, wtime); 
  count++;
  //console.log("count: ", count);
  if(count == 100000){
      console.timeEnd("time_check");
      console.log("count: ", count);
      }

}); 

//count = 0;


consumer.on('error', function (err) {
  console.log('error', err);
});


async function detectInvalidData(ae, values, valueInMessage, wtime){
  ////SCEN1. 유효하지 않은 데이터 찾기
  var predata = await getDataFromRedis('predata_' + ae);

  if(predata === null){
    setDataToRedis('predata_' + ae, values);
    //console.log('Set predata_' + ae);
  }
  else { 
    var trueORfalse = await isValid(ae, timeWindow, predata, valueInMessage);            
    if(trueORfalse){
    //정상적인 데이터일 경우
      setDataToRedis('predata_' + ae, values);
      //console.log(`SCEN1. Update NomalPoint. device: ${ae} time: ${wtime} lat: ${valueInMessage.lat}`);
    }
    else {
    // 튄 데이터일 경우
      writeToInflux('Abnormal_' + ae, valueInMessage);
      //console.log(`SCEN1.data is not valid device: ${ae} time: ${wtime}`);
    }
  }
  return;
}

function isValid(ae, timeWindow, PreData , CurrentData){
  var PreviousData = JSON.parse(PreData);
  var Current_time = CurrentData.wtime;

  return new Promise((resolve, reject) => {
    Rclient.zremrangebyscore('sorted_' + ae, "-inf", Current_time-timeWindow-1 );
    Rclient.zrangebyscore('sorted_' + ae, Current_time-timeWindow, Current_time, function(err, data){
      if(err){
        reject(err);
      }
      else {
        resolve(data);
      }    
    });

  }).then(result => {
    var max = result.length;
    if(max === 0){
      return true;
    }
    var totalDistance = 0, avgDistance = 0;  
    for(var index=1; index<max; index++){
      var prePoint = JSON.parse(result[index-1]);
      var curPoint = JSON.parse(result[index]);

      //console.log('distance: ',distance(prePoint.lat, prePoint.lng, curPoint.lat, curPoint.lng))

      totalDistance += distance(prePoint.lat, prePoint.lng, curPoint.lat, curPoint.lng);
    }
    avgDistance = totalDistance / max;
    //console.log("avgDistance", avgDistance);

    if(avgDistance ===0){
      return true;
    }    

    let avgDistance3times = avgDistance*3;
    let checkDistance = distance(PreviousData.lat, PreviousData.lng, CurrentData.lat, CurrentData.lng);
    if(distance(PreviousData.lat, PreviousData.lng, CurrentData.lat, CurrentData.lng) > avgDistance3times){
      //console.log(`The value is not valid.checkDistance: ${checkDistance} avgDistance*3: ${avgDistance3times}`);
      return false;
    }
    else {
      //console.log(`The value is valid.checkDistance: ${checkDistance} avgDistance*3: ${avgDistance3times}`);
      return true;
    }

  });
}


function getDataFromRedis(key) {
  return new Promise((resolve, reject) => {
    Rclient.get(key, function (err, data) {
      if (err) {
        reject(err);
      }
      else {
        //resolve(JSON.parse(data));
        resolve(data);
      }
    });
  });
}

function setDataToRedis(key, value) {
  Rclient.set(key, value, function (err, data) {
    if (err) {
      console.log(`set err: ${err}`);
      return;
    }
  });
}



function distance(lat1, lng1, lat2, lng2) {
  var p = 0.017453292519943295;
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p) / 2 +
    c(lat1 * p) * c(lat2 * p) *
    (1 - c((lng2 - lng1) * p)) / 2;

  return (12742 * Math.asin(Math.sqrt(a)) * 1000); //(m)
}



function writeToInflux(ae, valueInMessage, delayTime){        
  //console.log("input to InfluxDB success", ae);
  // let ae_name  = ae;
  // let cnt_name  = 'preprocessing';
  // let wtime = valueInMessage.wtime
  // let cinContentsData = valueInMessage;
  // cinContentsData.delayTime = delayTime;

  // influx.writePoints([
  //   { measurement: ae_name,
  //     tags: { cnt: cnt_name },
  //     fields: cinContentsData, 
  //     timestamp: wtime }
  //  ],{
  //   precision: 'ms',
  //  }).catch(err => {
  //   console.error(`Error saving data to InfluxDB!${ae} ${err.stack}`)
  //  });    
}