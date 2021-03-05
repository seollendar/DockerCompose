const express = require('express');
const app = express();
var axios = require('axios');

const Influx = require('influx');
const influx = new Influx.InfluxDB('http://admin:password@localhost:8086/timeseriestest')
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
var topic = 'fullNotification'; //Notification2

var klient = new Klient({ kafkaHost: 'localhost:9092' });
var topics = [{ topic: topic, partition: 0 }];
var options = { autoCommit: false, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };

var consumer = new Consumer(klient, topics, options);
var offset = new Offset(klient);



//============================================================

var count=0;
console.time("time check");
consumer.on('message', async function (message) {
	count++;
	if(count == 13){
		console.timeEnd("time check");
		console.log("count: ", count);
	}
	
	var jsonbody = JSON.parse(message.value);

	if(jsonbody['m2m:sgn']&& jsonbody['m2m:sgn'].nev && jsonbody['m2m:sgn'].nev.rep && jsonbody['m2m:sgn'].nev.rep['m2m:cin']){
		let cinContents = jsonbody['m2m:sgn'].nev.rep['m2m:cin'].con;
		let resources = jsonbody['m2m:sgn'].sur.split('/');
		let ae  = resources [4];
		let container  = resources [5];  
		// console.log("Received Data : \n {AE: ", ae, "\n Container: ", container ," \n contentInstance: ", cinContents );
		
		const string_cinContents = JSON.stringify(cinContents);
		let deviceTime = cinContents.time;
		let epoch = moment(deviceTime).unix();//Epoch timestamp(s) YYYY-MM-DDT
		let DateformatConversion = moment(deviceTime).format('YYYY-MM-DD'); //TimeFormat: YYYY-MM-DD
		var startDayTimeSet = moment(DateformatConversion).unix(); //Epoch timestamp(s) YYYY-MM-DD
		var endDayTimeSet = startDayTimeSet + 86399;  
		// var startTime = startDayTimeSet*1000000000;
		// var endTime = endDayTimeSet*1000000000; 
		var startTime = 1604847600000000000;
		var endTime = 1604933999000000000; 
		
		
		if(container == "scnt-location"){// == "scnt-location"
			// console.log(">>> Received location data");			   
			var string_previousLocationData = await getDataFromRedis('previousLocationData_' + ae);
			var previousLocationData = JSON.parse(string_previousLocationData);

		  
			if(previousLocationData == null){
				setDataToRedis('previousLocationData_' + ae, string_cinContents);
			 
			}else
			{
				if(deviceTime === previousLocationData.time){ //중복데이터 검사
					//console.log('Received overlap Data');
				}
				else{
					// console.log("previousLocationData: ", previousLocationData);
					// console.log("Received Data : \n {AE: ", ae, "\n Container: ", container ," \n contentInstance: ", cinContents );
					
					setDataToRedis('previousLocationData_' + ae, string_cinContents);
				
					var Onlist = await getDataFromRedis('preprocessingList_' + ae); //string [1,4,7]
					// console.log("Onlist:", Onlist);
				
					if(Onlist == null){
						// console.log("please Set list options")
					}else
					{
						const preprocessingOnList = {
							"list": JSON.parse(Onlist)
						}				
						tryPreprocessingSwitch(preprocessingOnList, ae, container, startTime, endTime, previousLocationData, cinContents);
					}  
				}
			}
	
	
		}else if(container == "scnt-timeseries"){
			var string_previousTimeseriesData = await getDataFromRedis('previousTimeseriesData_' + ae);
			var previousTimeseriesData = JSON.parse(string_previousTimeseriesData);
			
			
			if(previousTimeseriesData == null){
				setDataToRedis('previousTimeseriesData_' + ae, string_cinContents);
			 
			}else
			{
				// console.log("previousTimeseriesData: ", previousTimeseriesData);
				// console.log(">>> Received timeseries data");
				// console.log("Received Data : \n {AE: ", ae, "\n Container: ", container ," \n contentInstance: ", cinContents );
				preprocessingForTimeseriesData(ae, container, startTime, endTime);
				setDataToRedis('previousTimeseriesData_' + ae, string_cinContents);
			}
			
			
			
		}else{
			
			// console.log(">>> Received data, not scnt-location ");
			
		}
	

	
	}else{
		  console.log("Notification: Receive other notification message (Not exists 'm2m:cin')");
		  return;
		}   

});

consumer.on('error', function (err) {
   console.log('error', err);
});


function preprocessingForTimeseriesData(ae, container, startTime, endTime){
	return Promise.all([getDailyMean(ae, container, startTime, endTime), getDailyMinimum(ae, container, startTime, endTime), getDailyMaximum(ae, container, startTime, endTime), getDailyCumulativeSum(ae, container, startTime, endTime)])
	.then(result =>{ 
		//console.log(result);
		var preprocessedTimeseriesDataObj = {};
		preprocessedTimeseriesDataObj["DailyMean"] = result[0];
		preprocessedTimeseriesDataObj["DailyMinimum"] = result[1];
		preprocessedTimeseriesDataObj["DailyMaximum"] = result[2];
		preprocessedTimeseriesDataObj["DailyCumulativeSum"] = result[3];
		// console.log("preprocessedTimeseriesDataObj \n" , preprocessedTimeseriesDataObj);
		
		//sendToInfluxdb(ae, container, cinContents, PreprocessedDataObj);  
		//sendToMobius(ae, container ,PreprocessedDataObj.toString());
	
	});
}


async function tryPreprocessingSwitch(preprocessingOnList, ae, container, startTime, endTime, previousData, cinContents){
	var PreprocessedDataObj = {};            
	for(var index of preprocessingOnList.list){                     
		switch(index){
			case 1:   
				// console.log(`processing 1`);
				let DailyMean = await getDailyMean(ae, container, startTime, endTime);
				// console.log("DailyMean", DailyMean);
				PreprocessedDataObj["DailyMean"] = DailyMean; 
				break;
			case 2:
				// console.log(`processing 2`);
				var DailyMinimum = await getDailyMinimum(ae, container, startTime, endTime);
				PreprocessedDataObj["DailyMinimum"] = DailyMinimum; 
				// console.log("DailyMinimum", DailyMinimum);
				break;
			case 3:
				// console.log(`processing 3`);
				var DailyMaximum = await getDailyMaximum(ae, container, startTime, endTime);
				PreprocessedDataObj["DailyMaximum"] = DailyMaximum; 
				// console.log("DailyMaximum", DailyMaximum);
				break;
			case 4:
				// console.log(`processing 4`);
				var DailyCumulativeSum = await getDailyCumulativeSum(ae, container, startTime, endTime);
				PreprocessedDataObj["DailyCumulativeSum"] = DailyCumulativeSum; 
				// console.log("DailyCumulativeSum", DailyCumulativeSum);
				break;
			case 5:                 
				// console.log(`processing 5`);
				var Speed =  getSpeed(previousData, cinContents);
				PreprocessedDataObj["Speed"] = Speed; 
				break;
			case 6:                 
				// console.log(`processing 6`);
				var Distance =  getDistance(previousData, cinContents);
				PreprocessedDataObj["Distance"] = Distance; 
				break;
			case 7:
				// console.log(`processing 7`);
				var Direction =  getDirection(previousData, cinContents);
				PreprocessedDataObj["Direction"] = Direction; 
				break;
			default:
				break;
		}
	  
	}
	
	// console.log("PreprocessedDataObj", PreprocessedDataObj);
	//sendToInfluxdb(ae, container, cinContents, PreprocessedDataObj);  
	//sendToMobius(ae, container ,PreprocessedDataObj.toString());

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


function sendToInfluxdb(ae, container, cinContents, PreprocessedDataList){
   // console.log("PreprocessedDataList: ", PreprocessedDataList);
   
   let epoch = moment(cinContents.time).unix();
   
   influx.writePoints([
   { measurement: ae,
   tags: { cnt: container },
   fields: PreprocessedDataList, 
   timestamp: epoch, 
   }], {
   precision: 's',
   }).then (result =>{
   //     console.log (">>> Send Response (Influx), 200");
     }).catch (e =>{
       console .log ("influx ERR: ", e .stack );
          })    
}


function sendToMobius(ae, container, PreprocessedData){
	var data = '{\n  "m2m:cin": {\n    "cnf": "application/json",\n    "con":{\n            "AE":"'+ ae + '",\n            "Container":"'+ container + '",\n            "preprocessing": "'+ PreprocessedData +' "           \n          }\n  }\n}';
	var config = {
	  method: 'post',
	  url: 'http://localhost:7579/Mobius/AE_preprocessingData/cnt_preprocessingData',
	  headers: { 
		'Accept': 'application/json', 
		'X-M2M-RI': '123sdfgd45', 
		'X-M2M-Origin': 'S20170717074825768bp2l', 
		'Content-Type': 'application/json; ty=4', 
		'content-location': 'ae-influx'
	  },
	  data : data
	};

	axios(config)
	.then(function (response) {
	  // console.log(">>> Send OK, ",JSON.stringify(response.data));
	})
	.catch(function (error) {
	  console.log(error);
	});

}


/*    
* 1. 일간 평균값 조회
*/
 function getDailyMean(deviceID, containerName, startTime, endTime){
    var deviceID = 'dt1';
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select MEAN(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql);
    return influx.query(sql).then(result => {
       
        if(result){
			// console.log("mean_result: ", result);
			var returnValues = result[0].mean_temperature
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
	var deviceID = 'dt1';
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select min(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        // console.log("2.result: ", result);

        if(result){   
			// console.log("min_result: ", result);			
			var returnValues = result[0].min_temperature; 
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
	var deviceID = 'dt1';
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select max(*) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        // console.log("3.result: ", result);

        if(result){   
			// console.log("max_result: ", result);
			var returnValues = result[0].max_temperature;
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
	var deviceID = 'dt1';
    // console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startTime}, to = ${endTime}`);
    sql = `select SUM(temperature) from `+ deviceID + ` where time >= `+ startTime + ` and time <= `+ endTime + ``

    // console.log(sql)
    return influx.query(sql).then(result => {
        //console.log("4.result: ", result);

        if(result){  
			// console.log("sum_result: ", result);
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
function getSpeed(previousData, cinContents){
   
   var distancePerM = distance(previousData.latitude, previousData.longitude, cinContents.latitude, cinContents.longitude);//이동거리(m)
    var TimeDiff = (moment(cinContents.time) - moment(previousData.time)/1000); // 단위:s
    var computevelocity = computespeed(TimeDiff, distancePerM);//이동속도
   // console.log("computevelocity",computevelocity);
   
   return computevelocity;
}


/*    
* 6. 이동거리
*/
function getDistance(previousData, cinContents){
   var distancePerM = distance(previousData.latitude, previousData.longitude, cinContents.latitude, cinContents.longitude);//이동거리(m)
   // console.log("distancePerM", distancePerM);
   return distancePerM;
}


/*    
* 7. 이동방향
*/
function getDirection(previousData, cinContents){
   let direction = getbearing(previousData.latitude, previousData.longitude, cinContents.latitude, cinContents.longitude);
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