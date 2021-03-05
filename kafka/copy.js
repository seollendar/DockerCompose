const express = require('express');
const app = express();

const Influx = require('influx');
const influx = new Influx.InfluxDB('http://admin:password@localhost:8086/timeseries')
var moment = require('moment');
require('moment-timezone'); 
moment.tz.setDefault("UTC"); 

app.listen(7999, ()=> {
  console.log("Server Start on port 7999");
})

const redis = require('redis');
Rclient = redis.createClient(6379, '127.0.0.1');

var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Offset = kafka.Offset;
var Klient = kafka.KafkaClient;
var topic = 'Notificationtest2';

var klient = new Klient({ kafkaHost: 'localhost:9092' });
var topics = [{ topic: topic, partition: 0 }];
var options = { autoCommit: false, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };

var consumer = new Consumer(klient, topics, options);
var offset = new Offset(klient);

//============================================================

var count=0;
consumer.on('message', async function (message) {
	count++;
	var jsonbody = JSON.parse(message.value);

	if(jsonbody['m2m:sgn']&& jsonbody['m2m:sgn'].nev && jsonbody['m2m:sgn'].nev.rep && jsonbody['m2m:sgn'].nev.rep['m2m:cin']){
		let cinContents = jsonbody['m2m:sgn'].nev.rep['m2m:cin'].con;
		let resources = jsonbody['m2m:sgn'].sur.split('/');
		let ae  = resources [4];
		let container  = resources [5];  
		const string_cinContents = JSON.stringify(cinContents);
		let deviceTime = cinContents.time;
		let epoch = moment(deviceTime).unix();//Epoch timestamp(s) YYYY-MM-DDT
		let DateformatConversion = moment(deviceTime).format('YYYY-MM-DD'); //TimeFormat: YYYY-MM-DD
		var startTimeSet = moment(DateformatConversion).unix(); //Epoch timestamp(s) YYYY-MM-DD
		var endTimeSet = startTimeSet + 86399;  
		var startTime = startTimeSet*1000000000;
		var endTime = endTimeSet*1000000000; 
       
		// console.log(cinContents, count);

		var string_prevData = await getDataFromRedis('prevData_' + ae);
		var prevData = JSON.parse(string_prevData);
		//console.log("prevData: ", prevData);
      
		if(prevData == null){
			setDataToRedis('prevData_' + ae, string_cinContents);
         
		}else
		{
			if(deviceTime === prevData.time){ //중복데이터 검사
				console.log('Received overlap Data');
			}
			else{
				setDataToRedis('prevData_' + ae, string_cinContents);
            
				var Onlist = await getDataFromRedis('preprocessingList_' + ae); //string [1,4,7]
				console.log("Onlist:", Onlist);
            
				if(Onlist == null){
					console.log("please Set list options")
				}else
				{
					const preprocessingOnList = {
						"list": JSON.parse(Onlist)
					}
					
					
					tryPreprocessingSwitch(preprocessingOnList);
					
					function tryPreprocessingSwitch(preprocessingOnList){
						var PreprocessedDataObj = {};            
						preprocessingOnList.list.forEach(async index => {                     
							switch(index){
								case 1:   
									// console.log(`processing 1`);
									let DailyMean = await getDailyMean(ae, container, startTime, endTime);
									console.log("DailyMean", DailyMean);
									PreprocessedDataObj["DailyMean"] = DailyMean; 
									break;
								case 2:
									// console.log(`processing 2`);
									var DailyMinimum = await getDailyMinimum(ae, container, startTime, endTime);
									PreprocessedDataObj["DailyMinimum"] = DailyMinimum; 
									console.log("DailyMinimum", DailyMinimum);
									break;
								case 3:
									// console.log(`processing 3`);
									var DailyMaximum = await getDailyMaximum(ae, container, startTime, endTime);
									PreprocessedDataObj["DailyMaximum"] = DailyMaximum; 
									console.log("DailyMaximum", DailyMaximum);
									break;
								case 4:
									// console.log(`processing 4`);
									var DailyCumulativeSum = await getDailyCumulativeSum(ae, container, startTime, endTime);
									PreprocessedDataObj["DailyCumulativeSum"] = DailyCumulativeSum; 
									console.log("DailyCumulativeSum", DailyCumulativeSum);
									break;
								case 5:                 
									// console.log(`processing 5`);
									var Speed =  getSpeed(prevData, cinContents);
									PreprocessedDataObj["Speed"] = Speed; 
									break;
								case 6:                 
									// console.log(`processing 6`);
									var Distance =  getDistance(prevData, cinContents);
									PreprocessedDataObj["Distance"] = Distance; 
									break;
								case 7:
									// console.log(`processing 7`);
									var Direction =  getDirection(prevData, cinContents);
									PreprocessedDataObj["Direction"] = Direction; 
									break;
								default:
									break;
							}
						  
						});
					
						console.log("PreprocessedDataObj", PreprocessedDataObj);
						//sendToInfluxdb(ae, container, cinContents, PreprocessedDataObj);  				
               
					}	               
            
				}  
			}
		}
	
	}else{
		  console.log("Notification: Receive other notification message (Not exists content-location)");
		  return;
		}   

});

consumer.on('error', function (err) {
   console.log('error', err);
});


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


function sendToInfluxdb(ae, container, cinContents, PreprocessedDataList){
   console.log("PreprocessedDataList: ", PreprocessedDataList);
   
   let epoch = moment(cinContents.time).unix();
   
   influx.writePoints([
   { measurement: ae,
   tags: { cnt: container },
   fields: PreprocessedDataList, 
   timestamp: epoch, 
   }], {
   precision: 's',
   }).then (result =>{
       console.log (">>> Send Response (Influx), 200");
     }).catch (e =>{
       console .log ("influx ERR: ", e .stack );
          })    
}


/* function send_to_Mobius(ae_name, cnt_name, longitude, latitude){

    url = 'http://203.254.173.175:7579/Mobius/' + ae_name + '/' + cnt_name
    console.log("url", url);
    headers = {'Accept': 'application/json', 'X-M2M-RI': 'S', 'X-M2M-Origin': 'S', 'Content-Type': 'application/json; ty=4'}

    loctime = dt + timedelta(seconds=index * TIMEINTERVAL)
    body = '{"m2m:cin": { "con": {' + preprocessingList + '}  }}', "time": '2020-02-12T14:27:33"} }}
    req = requests.post(url, headers=headers, data=body)
    console.log(req.status_code);
    console.log(req.text);

} */


/*    
* 1. 일간 평균값 조회
*/
 function getDailyMean(deviceID, containerName, startTime, endTime){
    
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select MEAN(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql);
    return influx.query(sql).then(result => {
       
        if(result){
         
         var returnValues = result[0].mean_speed;//19.75
         return returnValues;
         
        }
      //if no response
      else {
          console.log("{}");  
        }
    }).catch(err => {
        console.log(err);
    });
}


/*    
* 2. 일간 최소값 조회
*/
function getDailyMinimum(deviceID, containerName, startTime, endTime){
   
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select min(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        // console.log("2.result: ", result);

        if(result){   

         var returnValues = result[0].min_speed; 
         return returnValues;

        }else{//if no response
          console.log("{}"); 
        }

    }).catch(err => {
        console.log(err);
    })

}


/* 
* 3. 일간 최대값 조회
*/
function getDailyMaximum(deviceID, containerName, startTime, endTime){

    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select max(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        // console.log("3.result: ", result);

        if(result){   
		
         var returnValues = result[0].max_speed;
         return returnValues;         
        
        }else{//if no response
          console.log("{}");   
        }

    }).catch(err => {
        console.log(err);
    })

}


/* 
* 4. 일간 누적합 조회
*/
function getDailyCumulativeSum(deviceID, containerName, startTime, endTime){
  
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select SUM(speed) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        //console.log("4.result: ", result);

        if(result){  
			var returnValues = result[0].sum;
			return returnValues;

			}else{//if no response
			  console.log("{}");
			}

    }).catch(err => {
        console.log(err);
    });
}



/*    
* 5. 이동속도
*/
function getSpeed(prevData, cinContents){
   
   var distancePerM = distance(prevData.latitude, prevData.longitude, cinContents.latitude, cinContents.longitude);//이동거리(m)
    var TimeDiff = (moment(cinContents.time) - moment(prevData.time)/1000); // 단위:s
    var computevelocity = computespeed(TimeDiff, distancePerM);//이동속도
   // console.log("computevelocity",computevelocity);
   
   return computevelocity;
}


/*    
* 6. 이동거리
*/
function getDistance(prevData, cinContents){
   var distancePerM = distance(prevData.latitude, prevData.longitude, cinContents.latitude, cinContents.longitude);//이동거리(m)
   // console.log("distancePerM", distancePerM);
   return distancePerM;
}


/*    
* 7. 이동방향
*/
function getDirection(prevData, cinContents){
   let direction = getbearing(prevData.latitude, prevData.longitude, cinContents.latitude, cinContents.longitude);
   // console.log("direction", direction);
   return direction;
   
}


function distance(lat1, lon1, lat2, lon2){ 
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  //console.log(12742 * Math.asin(Math.sqrt(a))*1000)// 2 * R; R = 6371 km
  return (12742 * Math.asin(Math.sqrt(a))*1000);
}


function computespeed (timediff, distancediff){
  if(distancediff == 0){
    tspeed = 0;  
  }else{
    tspeed = distancediff / timediff;
  }
  //console.log(`speed: ${tspeed} timediff ${timediff} distancediff ${distancediff}`);
  return tspeed;
} 


function convertdecimaldegreestoradians(deg){
   return (deg * Math.PI / 180);
}

/*decimal radian -> degree*/
function convertradianstodecimaldegrees(rad){
   return (rad * 180 / Math.PI);
}

/*bearing*/
function getbearing(lat1, lon1, lat2, lon2){
   let lat1_rad = convertdecimaldegreestoradians(lat1);
   let lat2_rad = convertdecimaldegreestoradians(lat2);
   let lon_diff_rad = convertdecimaldegreestoradians(lon2-lon1);
   let y = Math.sin(lon_diff_rad) * Math.cos(lat2_rad);
   let x = Math.cos(lat1_rad) * Math.sin(lat2_rad) - Math.sin(lat1_rad) * Math.cos(lat2_rad) * Math.cos(lon_diff_rad);
   return (convertradianstodecimaldegrees(Math.atan2(y,x)) + 360) % 360;
}