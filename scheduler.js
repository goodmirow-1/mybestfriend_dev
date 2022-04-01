const express = require('express');
const methodOverride = require('method-override');		//Post,Delete,Update 관련 Module
const bodyParser = require('body-parser');			//Json으로 데이터 통신 Module
const helmet = require('helmet');				//http 보안관련 Module
const multer = require('multer');				//파일 저장용 Moudle

const formidable = require('formidable');
const fs_extra = require('fs-extra');

const models = require("./models/index.js");
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const expressEjsLayout = require('express-ejs-layouts');
const schedule = require('node-schedule');

const op = require('sequelize').Op;

const app = express();

const globalRouter = require('./routes/global');
const fcmRouter = require('./routes/fcm/fcmRouter');
const fcmFuncRouter = require('./routes/fcm/fcmFuncRouter');
const client = globalRouter.client;

const { promisify } = require("util");
const getallAsync = promisify(client.hgetall).bind(client);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(helmet());

app.use('/Fcm', fcmRouter);

var moment = require('moment');
const { permittedCrossDomainPolicies } = require('helmet');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var jobList= [];

app.set('port', process.argv[2] || process.env.PORT || 50008);
const server = app.listen(app.get('port'), () => {
	console.log('Express server listening on port ' + app.get('port'));
});

var generateNumber = function(min, max) {
    if(min > max) {
        throw new Error('Minimum value should be smaller than maximum value.');
    }
    var range = max - min;
    return min + range * Math.random();
};

3
function getRandomInt(min, max) { //min ~ max 사이의 임의의 정수 반환
    return Math.floor(Math.random() * (max - min)) + min;
}

var URL = "scheduler/";

// sequelize 연동
models.sequelize.sync().then( async () => {
	console.log("DB Connect Success");

	//Schdule 등록
	//매일 11시						초 분 시 일 월 주
	var job = schedule.scheduleJob('00 00 11 * * *', function() {
		//Temp에 등록된 데이터 삭제
		let mNow = new Date();
		console.log('remove temp folder call');
		console.log(mNow);
		globalRouter.removefiles('./AllPhotos/Temp/');
    });
    
    // //밥 먹는거 세팅 - 매 1분
    // var job2 = schedule.scheduleJob('*/5 * * * *', async function() {

    //     var bowlType = getRandomInt(0, 2);

    //     var lastEat = await models.Intake.findOne({
    //         where : {
    //             PetID : 2,
    //             BowlType : bowlType,
    //         },
    //         order : [['id', 'DESC']]
    //     });

    //     //밥을 줘야함
    //     if(globalRouter.IsEmpty(lastEat) || lastEat.Amount < 100.0){
    //         await models.Intake.create({
    //             PetID : 2,
    //             BowlWeight : 236.7,
    //             Amount : generateNumber(500,1000).toFixed(2),
    //             BowlType : bowlType,
    //             State : 1,
    //         }).then(result => {
    //                 console.log(URL + '/Insert/Intake Intake create Success');
    //         }).catch(err => {
    //                 console.log(URL + '/Insert/Intake Intake create Failed ' + err);
    //         })
    //     }else{
    //         //먹기 시작함
    //         await models.Intake.create({
    //             PetID : 2,
    //             BowlWeight : 236.7,
    //             Amount : lastEat.Amount,
    //             BowlType : bowlType,
    //             State : 2,
    //         }).then(result => {
    //                 console.log(URL + '/Insert/Intake Intake create Success');
    //         }).catch(err => {
    //                 console.log(URL + '/Insert/Intake Intake create Failed ' + err);
    //         })

    //         //다먹음
    //         await models.Intake.create({
    //             PetID : 2,
    //             BowlWeight : 236.7,
    //             Amount : (lastEat.Amount - generateNumber(50,100).toFixed(2)).toFixed(2),
    //             BowlType : bowlType,
    //             State : 3,
    //         }).then(result => {
    //                 console.log(URL + '/Insert/Intake Intake create Success');
    //         }).catch(err => {
    //                 console.log(URL + '/Insert/Intake Intake create Failed ' + err);
    //         })

    //         let mNow = new Date();
    //         console.log('insert pet intake job2 call');
    //         console.log(mNow);
    //     }
    // // });

    // //밥 먹는거 세팅 - 8,13,18시
    // var job3 = schedule.scheduleJob('00 00 8,13,18 * *', async function() {
    //     await feedTestFunc(0);
    //     await feedTestFunc(0);
    // });

    // //물 마시는거 세팅 - 8,13,18시 1분
    // var job4 = schedule.scheduleJob('00 01 8,13,18 * *', async function() {
    //     await feedTestFunc(1);
    //     await feedTestFunc(1);
    // });

    var job6 = await FoodAndWaterStandardDeviation('DONG');

    var job7 = await FoodAndWaterStandardDeviation('SI');

    var job8 = await FoodAndWaterStandardDeviation('GU');

    var job9 = await checkIntakes();

    jobList.push(job);
    //jobList.push(job2);
    // jobList.push(job3);
    // jobList.push(job4);
    // jobList.push(job5);
    jobList.push(job6);
    jobList.push(job7);
    jobList.push(job8);
    jobList.push(job9);
}).catch( err => {
    console.log("DB Connect Faield");
    console.log(err);
})

app.use(function(req,res,next){
	if(isDisableKeepAlive){
		res.set('Connection', 'close');
	}
	next();
});

let isDisableKeepAlive = false;

process.on('SIGTERM', shutDown); //정상종료 
process.on('SIGINT', shutDown); //비정상종료

function shutDown() {

	console.log('Received kill signal, shutting down gracefully');
	server.close(() => {
		console.log('Closed out remaining connections');
		process.exit(0);
	});

	setTimeout(() => {
		console.log('Could not close connections in time, forcefully shutting down');
		process.exiit(1);
	}, 10000);
}

//임시 폴더 사진 파일 삭제
function TempPhotoClear() {
    console.log('Do Schedule TempPhotoClear');

    return job = schedule.scheduleJob('00 00 11 * * *', function() {
		let mNow = new Date();
		console.log('remove temp folder call');
		console.log(mNow);
		globalRouter.removefiles('./AllPhotos/Temp/');
	});
};

async function feedTestFunc(bowlType){
    await models.Pet.findAll({}).then(async petResult => {
        for(var i = 0 ; i < petResult.length ; ++i){
            if(petResult[i].id == 404) continue;
            var lastEat = await models.Intake.findOne({
                where : {
                    PetID : petResult[i].id,
                    BowlType : bowlType,
                },
                order : [['id', 'DESC']]
            });
    
            //밥을 줘야함
            if(globalRouter.IsEmpty(lastEat) ||lastEat.Amount < 100.0){
                await models.Intake.create({
                    PetID : petResult[i].id,
                    BowlWeight : 236.7,
                    Amount : generateNumber(500,1000).toFixed(2),
                    BowlType : bowlType,
                    State : 1,
                }).then(result => {
                        console.log(URL + '/Insert/Intake Intake create Success');
                }).catch(err => {
                        console.log(URL + '/Insert/Intake Intake create Failed ' + err);
                })
            }else{
                //먹기 시작함
                await models.Intake.create({
                    PetID : petResult[i].id,
                    BowlWeight : 236.7,
                    Amount : lastEat.Amount,
                    BowlType : bowlType,
                    State : 2,
                }).then(result => {
                        console.log(URL + '/Insert/Intake Intake create Success');
                }).catch(err => {
                        console.log(URL + '/Insert/Intake Intake create Failed ' + err);
                })
    
                //다먹음
                await models.Intake.create({
                    PetID : petResult[i].id,
                    BowlWeight : 236.7,
                    Amount : (lastEat.Amount - generateNumber(50,100).toFixed(2)).toFixed(2),
                    BowlType : bowlType,
                    State : 3,
                }).then(result => {
                        console.log(URL + '/Insert/Intake Intake create Success');
                }).catch(err => {
                        console.log(URL + '/Insert/Intake Intake create Failed ' + err);
                })
    
                let mNow = new Date();
                console.log('insert pet intake job3 call');
                console.log(mNow);
            }
        }
    }).catch(err => {
        console.log(URL + '/Insert/Intake Intake create Failed ' + err);
    })
}

//표준편차 및 평균값 도출
function calculateinfo(list){
    var m = 0;
    
    //평균 값 계산
    list.forEach(function(element){
        m += element;
    });

    if(list.length != 0) m = m / list.length;

    //편차의 제곱 계산
    var disSqrtList = [];
    list.forEach(function(element){
        disSqrtList.push(Math.pow(element - m,2));
    });

    //편차 제곱의 합
    var dism = 1;
    disSqrtList.forEach(function(element){
        dism += element;
    });

    //편차 제곱의 평균
    if(disSqrtList.length != 0) dism = dism / disSqrtList.length;

    //표준편차
    var standardDeviation = Math.sqrt(dism);

    var info = {
        standardDeviation,
        m
    }

    return  info; 
}

//물, 칼로리 섭취/권장 넣으면 점수로 바꿔서 리턴함.
function convertScore(ratio) {
    if (ratio < 0 || ratio > 2) return 1/10;
    if (ratio < 2/3) return (3/4*ratio)*100;
    if (ratio > 4/3) return (-3/4*(ratio - 2))*100;
  
    var score = (-9/2 * (ratio - 2/3) * (ratio - 4/3) + 1/2) * 100;

    return score;
}

//사료 평균 표준편차, 몸무게 평균 표준편차
async function FoodAndWaterStandardDeviation(type) {
    console.log('Do Schedule FoodStandardDeviation');

    //매일 새벽 2시
    var job = schedule.scheduleJob('00 00 02 * * *', async function() {
		let start = new Date();
		console.log('Circulate FoodStandardDeviation call');
        
        //지역값 가져오기
        var locationStandardDeviation;

        if(type == 'DONG'){
            locationStandardDeviation = await models.LocationDongStandardDeviation.findAll({limit : 5000});
        }else if(type == 'SI'){
            locationStandardDeviation = await models.LocationSiStandardDeviation.findAll({limit : 500});
        }else{
            locationStandardDeviation = await models.LocationCountryStandardDeviation.findAll({limit : 50});
        }

        if(globalRouter.IsEmpty(locationStandardDeviation)){
            return false;
        }

        //지역값 순회하며 유저 찾기
        for(var index = 0 ; index < locationStandardDeviation.length; ++index){

            var rule = {};

            if(type != 'COUNTRY'){
                rule.Location = {[op.like] : '%' + locationStandardDeviation[index].Location + '%'}  
            }

            var userList = await models.User.findAll({
                where : rule,
                include : [
                    {
                        model : models.Pet,
                        required : true,
                        limit : 10,
                        order : [
                                ['Index', 'ASC']
                        ],
                        include : [
                            {
                                model : models.Intake,
                                required : false,
                                where : {
                                    createdAt : { 
                                        //24시간 이내
                                        [op.gte] : moment().subtract(24, 'H').toDate()
                                      },
                                }
                            },
                            {
                                model : models.IntakeSnack,
                                required : false,
                                where : {
                                    createdAt : { 
                                        //24시간 이내
                                        [op.gte] : moment().subtract(24, 'H').toDate()
                                      },
                                }
                            }
                        ]
                    }
                ]
            });
    
            //비어있으면
            if(globalRouter.IsEmpty(userList)){
                continue;
            }
    
            //점수 계산 식, 펫 몸무게
            var feedPointList = [];
            var waterPointList = [];
            var dogWeightList = [];
            var catWeightList = [];
            for(var i = 0 ; i < userList.length ; ++i){
                var user = userList[i];
    
                for(var j = 0 ; j < user['Pets'].length; ++j){
                    var pet = user['Pets'][j];
    
                    var listFeed = [];
                    var lsitWater = [];
    
                    var sumFeedAmount = 0.0;
    
                    var sumCalorie = 0.0;
                    var sumWater = 0.0;
    
                    //밥과 물을 나눔
                    for(var k = 0 ; k < pet['Intakes'].length ; ++k){
                        var Intake = pet['Intakes'][k];
                        if(Intake['BowlType'] == 0) listFeed.push(Intake); //밥
                        else if(Intake['BowlType'] == 1) lsitWater.push(Intake); //물
                    }
    
                    //밥 먹은 양 계산. 첫번째 무시
                    for(var k = 1; k < listFeed.length; k++){
                        //먹은 후가 있으면 이전 값과의 차를 먹은양으로 누적
                        if(listFeed[k].State == 3){
                            sumFeedAmount += listFeed[k].Amount - listFeed[k-1].Amount;
                        }
                    }
                    //칼로리 및 물 먹은 양으로 변환 및 누적
                    sumCalorie += sumFeedAmount * pet['FoodCalorie'] / 1000;//kg당 칼로리이므로
                    sumWater += sumFeedAmount * pet['FoodWater'];
    
                    //물 마신 양 계산. 첫번째 무시
                    for(var k = 1; k < lsitWater.length; k++){
                        //먹은 후가 있으면 이전 값과의 차를 먹은양으로 누적
                        if(lsitWater[k].State == 3){
                            sumWater += lsitWater[k].Amount - lsitWater[k-1].Amount;
                        }
                    }
    
                    //간식 데이터
                    for(var k = 0 ; k < pet['IntakeSnacks'].length; ++k){
                        var snack = pet['IntakeSnacks'][k];
                        sumCalorie += snack.Amount * snack.Calorie / 100;//100g당 칼로리이므로
                        sumWater += snack.Amount * snack.Water;//비율 그대로 곱하면 됨.
                    }
                     

                    var foodRecommend = 1;
                    var waterRecommend = 1;
                    if(pet.FoodRecommendedIntake != null && pet.FoodRecommendedIntake != 0) foodRecommend = pet.FoodRecommendedIntake;
                    if(pet.WaterRecommendedIntake != null && pet.WaterRecommendedIntake != 0) waterRecommend = pet.WaterRecommendedIntake;
                    //점수계산
                    var feedPoint = convertScore(sumCalorie / foodRecommend);
                    var waterPoint = convertScore(sumWater / waterRecommend);
    
                    feedPointList.push(feedPoint);
                    waterPointList.push(waterPoint);

                    //타입 구분해서 몸무게 리스트에 담음
                    if(pet.Type == 0){//개
                        dogWeightList.push(pet.Weight);
                    } else if(pet.Type == 1){//고양이
                        catWeightList.push(pet.Weight);
                    }
                }
            }
    
            var feedInfo = calculateinfo(feedPointList);
            var waterInfo = calculateinfo(waterPointList);
            var dogWeightInfo = calculateinfo(dogWeightList);
            var catWeightInfo = calculateinfo(catWeightList);
    
            locationStandardDeviation[index].update(
                {
                    FoodStandardDeviation : feedInfo.standardDeviation,
                    FoodAverage : feedInfo.m,
                    WaterStandardDeviation : waterInfo.standardDeviation,
                    WaterAverage : waterInfo.m,
                    DogWeightStandardDeviation : dogWeightInfo.standardDeviation,
                    DogWeightAverage : dogWeightInfo.m,
                    CatWeightStandardDeviation : catWeightInfo.standardDeviation,
                    CatWeightAverage : catWeightInfo.m,
                }
            )
        }

        let end = new Date();
        console.log('Schedule FoodStandardDeviation play time is ' + end);
    });
    
    return job;
};

app.post('/TEST', async(req, res) => {

    var userList = await models.User.findAll({
            where : {},
            include : [
                {
                    model : models.Pet,
                    required : true,
                    limit : 99,
                    order : [
                            ['Index', 'ASC']
                    ],
                    include : [
                        {
                            model : models.Intake,
                            required : true,
                            where : {
                                createdAt : { 
                                    //24시간 이내
                                    [op.gte] : moment().subtract(24, 'H').toDate()
                                  },
                            }
                        },
                        {
                            model : models.IntakeSnack,
                            required : false,
                            where : {
                                createdAt : { 
                                    //24시간 이내
                                    [op.gte] : moment().subtract(24, 'H').toDate()
                                  },
                            }
                        }
                    ]
                }
            ]
        });

    res.status(200).send(userList);
});

//몸무게표준편차
async function WeightStandardDeviation() {
    console.log('Do Schedule WeightStandardDeviation');

    return job = schedule.scheduleJob('00 00 02 * * *', function() {
		let mNow = new Date();
		console.log(mNow);
		globalRouter.removefiles('./AllPhotos/Temp/');
	});
};

app.get('/Schedule/Do/TempPhotoClear', function(req, res) {
	var job = TempPhotoClear();

	jobList.push(job);
	res.status(200).send(true);
});

app.post('/Schedule/Do/Circulate/FoodStandardDeviation', async function(req, res) {
    var job = await FoodAndWaterStandardDeviation(req.body.from);
    
    if(job == false){
        res.status(200).send(false);    
    }else{
        jobList.push(job);
        res.status(200).send(true);
    }
});

app.get('/Schedule/Do/Circulate/WaterDongStandardDeviation', async function(req, res) {
	var job = await WaterStandardDeviation();

	jobList.push(job);
	res.status(200).send(true);
});

app.get('/Schedule/Do/Circulate/WeightDongStandardDeviation', async function(req, res) {
    // 섭취량 평균표준편차 계산 함수랑 통합됨.
	// var job = await WeightStandardDeviation();

	// jobList.push(job);
	res.status(200).send(true);
});

app.get('/Schedule/Cancel' , function(req, res) {
	for(var i = 0 ; i < jobList.length; ++i){
		jobList[i].cancel();
	}
});

async function test3(type){
    let start = new Date();
    console.log('Circulate FoodStandardDeviation call');
    
    //지역값 가져오기
    var locationStandardDeviation;

    if(type == 'DONG'){
        locationStandardDeviation = await models.LocationDongStandardDeviation.findAll({limit : 5000});
    }else if(type == 'SI'){
        locationStandardDeviation = await models.LocationSiStandardDeviation.findAll({limit : 500});
    }else{
        locationStandardDeviation = await models.LocationCountryStandardDeviation.findAll({limit : 50});
    }

    if(globalRouter.IsEmpty(locationStandardDeviation)){
        return false;
    }

    //지역값 순회하며 유저 찾기
    for(var index = 0 ; index < locationStandardDeviation.length; ++index){

        var rule = {};
        

        if(type != 'COUNTRY'){
            rule.Location = {[op.like] : '%' + locationStandardDeviation[index].Location + '%'}  
        }

        if(locationStandardDeviation[index].id < 772 || locationStandardDeviation[index].id > 927) continue;

        var userList = await models.User.findAll({
            where : rule,
            include : [
                {
                    model : models.Pet,
                    required : true,
                    limit : 99,
                    order : [
                            ['Index', 'ASC']
                    ],
                    include : [
                        {
                            model : models.Intake,
                            required : false,
                            where : {
                                createdAt : { 
                                    //24시간 이내
                                    [op.gte] : moment().subtract(24, 'H').toDate()
                                  },
                            }
                        },
                        {
                            model : models.IntakeSnack,
                            required : false,
                            where : {
                                createdAt : { 
                                    //24시간 이내
                                    [op.gte] : moment().subtract(24, 'H').toDate()
                                  },
                            }
                        }
                    ]
                }
            ]
        });

        //비어있으면
        if(globalRouter.IsEmpty(userList)){
            continue;
        }
    
        //점수 계산 식, 펫 몸무게
        var feedPointList = [];
        var waterPointList = [];
        var dogWeightList = [];
        var catWeightList = [];
        for(var i = 0 ; i < userList.length ; ++i){
            var user = userList[i];

            for(var j = 0 ; j < user['Pets'].length; ++j){
                var pet = user['Pets'][j];

                var listFeed = [];
                var lsitWater = [];

                var sumFeedAmount = 0.0;

                var sumCalorie = 0.0;
                var sumWater = 0.0;

                //밥과 물을 나눔
                for(var k = 0 ; k < pet['Intakes'].length ; ++k){
                    var Intake = pet['Intakes'][k];
                    if(Intake['BowlType'] == 0) listFeed.push(Intake); //밥
                    else if(Intake['BowlType'] == 1) lsitWater.push(Intake); //물
                }

                //밥 먹은 양 계산. 첫번째 무시
                for(var k = 1; k < listFeed.length; k++){
                    //먹은 후가 있으면 이전 값과의 차를 먹은양으로 누적
                    if(listFeed[k].State == 3){
                        sumFeedAmount += listFeed[k].Amount - listFeed[k-1].Amount;
                    }
                }
                //칼로리 및 물 먹은 양으로 변환 및 누적
                sumCalorie += sumFeedAmount * pet['FoodCalorie'] / 1000;//kg당 칼로리이므로
                sumWater += sumFeedAmount * pet['FoodWater'];

                //물 마신 양 계산. 첫번째 무시
                for(var k = 1; k < lsitWater.length; k++){
                    //먹은 후가 있으면 이전 값과의 차를 먹은양으로 누적
                    if(lsitWater[k].State == 3){
                        sumWater += lsitWater[k].Amount - lsitWater[k-1].Amount;
                    }
                }

                //간식 데이터
                for(var k = 0 ; k < pet['IntakeSnacks'].length; ++k){
                    var snack = pet['IntakeSnacks'][k];
                    sumCalorie += snack.Amount * snack.Calorie / 100;//100g당 칼로리이므로
                    sumWater += snack.Amount * snack.Water;//비율 그대로 곱하면 됨.
                }
                 

                var foodRecommend = 1;
                var waterRecommend = 1;
                if(pet.FoodRecommendedIntake != null && pet.FoodRecommendedIntake != 0) foodRecommend = pet.FoodRecommendedIntake;
                if(pet.WaterRecommendedIntake != null && pet.WaterRecommendedIntake != 0) waterRecommend = pet.WaterRecommendedIntake;
                //점수계산
                var feedPoint = convertScore(sumCalorie / foodRecommend);
                var waterPoint = convertScore(sumWater / waterRecommend);

                feedPointList.push(feedPoint);
                waterPointList.push(waterPoint);

                //타입 구분해서 몸무게 리스트에 담음
                if(pet.Type == 0){//개
                    dogWeightList.push(pet.Weight);
                } else if(pet.Type == 1){//고양이
                    catWeightList.push(pet.Weight);
                }
            }
        }

        if(!globalRouter.IsEmpty(feedPointList) && !globalRouter.IsEmpty(waterPointList)){
            console.log("feedPointList : " + feedPointList);
            console.log("waterPointList : " + waterPointList);

            var feedInfo = calculateinfo(feedPointList);
            var waterInfo = calculateinfo(waterPointList);
            var dogWeightInfo = calculateinfo(dogWeightList);
            var catWeightInfo = calculateinfo(catWeightList);

            console.log("dogWM : " + dogWeightInfo.m);
            console.log("dogWS : " + dogWeightInfo.standardDeviation);
            console.log("catWM : " + catWeightInfo.m);
            console.log("catWS : " + catWeightInfo.standardDeviation);

            await locationStandardDeviation[index].update(
                {
                    FoodStandardDeviation : feedInfo.standardDeviation,
                    FoodAverage : feedInfo.m,
                    WaterStandardDeviation : waterInfo.standardDeviation,
                    WaterAverage : waterInfo.m,
                    DogWeightStandardDeviation : dogWeightInfo.standardDeviation,
                    DogWeightAverage : dogWeightInfo.m,
                    CatWeightStandardDeviation : catWeightInfo.standardDeviation,
                    CatWeightAverage : catWeightInfo.m,
                }
            )
        }
    }

    let end = new Date();
    console.log('Schedule FoodStandardDeviation play time is ' + end);
}

app.get('/test3', async(req, res) => {
    await test3('DONG');

    //await test3('SI');

    //await test3('COUNTRY');

    res.status(200).send(true);
})

app.get('/test2', async(req, res) => {
    await feedTestFunc(0);
    await feedTestFunc(0);

    await feedTestFunc(1);
    await feedTestFunc(1);
    
    res.status(200).send(true);
})

async function checkIntakes(){
    var job = schedule.scheduleJob('00 00 09 * * *', async function() {
        //물그릇
            var noIntakeInfoPets= [];
            await models.BowlDeviceTable.findAll({
                where : {
                    [op.not] : { PetID : null},
                }
            }).then(async result => {
                console.log('/Schedule/Do/CheckIntakes BowlDeviceTables findAll is Success');

                for(var i = 0 ; i < result.length; ++i){
                    await models.Intake.findAll({
                        where : {
                            PetID : result[i].PetID,
                            createdAt : { 
                                //24시간 이내
                                [op.gte] : moment().subtract(24, 'H').toDate()
                            },
                        }
                    }).then(async intakesResult => {
                        console.log('/Schedule/Do/CheckIntakes Intakes findAll is Success');
                        if(globalRouter.IsEmpty(intakesResult)){
        
                            var pet = await models.Pet.findOne(
                                    {
                                            attributes: ["UserID", "Name"],
                                            where : {id : result[i].PetID}
                                    }
                            );
        
                            var userID = pet.UserID;
                            var petID = result[i].PetID;
                            var petName = pet.Name;
                            var bowlType = result[i].Type;
        
                            var temp = {
                                userID,
                                petID,
                                petName,
                                bowlType,
                            }
        
                            noIntakeInfoPets.push(temp);
                        }
                    }).catch(err => {
                        console.log('/Schedule/Do/CheckIntakes Intakes findAll is failed ' + result[i].PetID);
                        console.log(err);
                    })
                }

                console.log(noIntakeInfoPets);
            }).catch(err => {
                console.log('/Schedule/Do/CheckIntakes BowlDeviceTables findAll is failed ' + err);
            })

            for(var i = 0 ; i < noIntakeInfoPets.length ; ++i){
                var intakeInfo = noIntakeInfoPets[i];

                var bodyMessage = "'" + intakeInfo.petName + "'의 " +((intakeInfo.bowlType == 0 ? "밥 그릇" : "물 그릇") + " 기기에 문제가 있는 것 같아요. LED 상태를 확인해 주세요!");

                var getAllRes = await getallAsync(String(intakeInfo.userID));

                var data = JSON.stringify({
                    userID : 1,             //마이베프
                    targetID : intakeInfo.userID,
                    title : "기기 알림",
                    type : "NEED_DEVICE_CHECK",
                    tableIndex : intakeInfo.petID,
                    subIndex : 0,
                    body : bodyMessage,
                    isSend : getAllRes.isOnline
                })
            
                if(await fcmFuncRouter.SendFcmEvent( data )){
                    console.log('Schedule/Do/CheckIntakes fcm is true');
                }else{
                    console.log('Schedule/Do/CheckIntakes fcm is failed');
                }
            }
    });

    return job;
}

app.get('/Schedule/Do/CheckIntakes', async function(req, res) {
    // var job = await checkIntakes();
    
    // if(job == false){
    //     res.status(200).send(false);    
    // }else{
    //     jobList.push(job);
    //     res.status(200).send(true);
    // }

    var noIntakeInfoPets= [];
    await models.BowlDeviceTable.findAll({
        where : {
            [op.not] : { PetID : null},
        }
    }).then(async result => {
        console.log('/Schedule/Do/CheckIntakes BowlDeviceTables findAll is Success');

        for(var i = 0 ; i < result.length; ++i){
            await models.Intake.findAll({
                where : {
                    PetID : result[i].PetID,
                    createdAt : { 
                        //24시간 이내
                        [op.gte] : moment().subtract(24, 'H').toDate()
                    },
                }
            }).then(async intakesResult => {
                console.log('/Schedule/Do/CheckIntakes Intakes findAll is Success');
                if(globalRouter.IsEmpty(intakesResult)){

                    var pet = await models.Pet.findOne(
                            {
                                    attributes: ["UserID", "Name"],
                                    where : {id : result[i].PetID}
                            }
                    );

                    var userID = pet.UserID;
                    var petID = result[i].PetID;
                    var petName = pet.Name;
                    var bowlType = result[i].Type;

                    var temp = {
                        userID,
                        petID,
                        petName,
                        bowlType,
                    }

                    noIntakeInfoPets.push(temp);
                }
            }).catch(err => {
                console.log('/Schedule/Do/CheckIntakes Intakes findAll is failed ' + result[i].PetID);
                console.log(err);
            })
        }

        console.log(noIntakeInfoPets);
    }).catch(err => {
        console.log('/Schedule/Do/CheckIntakes BowlDeviceTables findAll is failed ' + err);
        res.status(404).send(null);
    })

    for(var i = 0 ; i < noIntakeInfoPets.length ; ++i){
        var intakeInfo = noIntakeInfoPets[i];

        var bodyMessage = "'" + intakeInfo.petName + "' 의 " +((intakeInfo.bowlType == 0 ? "'밥' 그릇" : "'물' 그릇") + " 기기에 문제가 있는 것 같아요. LED 상태를 확인해 주세요!");

        var getAllRes = await getallAsync(String(intakeInfo.userID));

        var data = JSON.stringify({
            userID : 1,             //마이베프
            targetID : intakeInfo.userID,
            title : "기기 알림",
            type : "NEED_DEVICE_CHECK",
            tableIndex : intakeInfo.petID,
            subIndex : 0,
            body : bodyMessage,
            isSend : getAllRes.isOnline
        })
    
        //test1@test.test , guks iphon mini
        if(intakeInfo.userID == 73 || intakeInfo.userID == 136){
            if(await fcmFuncRouter.SendFcmEvent( data )){
                console.log('Schedule/Do/CheckIntakes fcm is true');
            }else{
                console.log('Schedule/Do/CheckIntakes fcm is failed');
            }
        }
    }

    res.status(200).send(true);
});

