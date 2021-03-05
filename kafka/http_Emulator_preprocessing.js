const axios = require('axios');
const moment = require('moment-timezone'); 
moment.tz.setDefault("UTC"); 

const header = {
  'Content-Type': 'application/json',
};

const port = 7980;
const baseURL = `http://localhost:${port}/`;

const HttpClient = axios.create({
  baseURL,
  headers: header,
});


const SEND_COUNT = 10;
var data_count = 0;
async function nonSleepdemo() {
	//console.time("set");
	for(var i=0; i<SEND_COUNT; i++){
		//await sleep(1000);
/*  	   let simple = {

				"i": i,
				//"ae": `yt${Math.round(Math.random())}`,
				// "ae": `yt${i}`,
				"ae": `dt1`,
				"container": "location",
				"wtime": moment().valueOf(),
				"lat": 37.459644+(i*0.001),
				"lng": 127.561136

	   }  */


/*  	let params = {
		 "m2m:sgn": {
		  "nev": {
			"rep": {
			 "m2m:cin": {
			   "cnf": "application/json",
			   "con": {
				"i": i,
				//"ae": `yt${Math.round(Math.random())}`,
				//"ae": `yt${i}`,
				"ae": `dt1`,
				"container": "location",
				"wtime": moment().valueOf(),
				"lat": 37.459644+(i*0.001),
				"lng": 127.561136
			   }
			 }
			}
		  }
		 }
	   }  */
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

	   
	   HttpClient.post(`noti_for_fastdata`, ntelsData).then(function (response) {
			//console.log(response.status);		 
			data_count ++;
			if(data_count == SEND_COUNT){
				//console.timeEnd("set");
				console.log("SENT DATA COUNT: ", data_count);
				console.log(response.status);
			}
		}).catch(function (err) {
                   //console.log("Promise Rejected");
              });
	}
	
}
   
nonSleepdemo();

function sleep(t){
   return new Promise(resolve=>setTimeout(resolve,t));
}