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
const schedule = require('node-schedule');
const cors = require('cors');
const bodyParserErrorHandler = require('express-body-parser-error-handler')

const userRouter = require('./routes/user/userRouter'),
		petRouter = require('./routes/pet/petRouter'),
		notifcationRouter = require('./routes/notification/notificationRouter'),
		fcmRouter = require('./routes/fcm/fcmRouter'),
		communityPostRouter = require('./routes/communitypost/communityPostRouter'),
		bowlRouter = require('./routes/bowl/bowlRouter');

const fcmFuncRouter = require('./routes/fcm/fcmFuncRouter');
const globalRouter = require('./routes/global');

const app = express();

var moment = require('moment');
var jobList= [];
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// Require static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set 'views' directory for any views 
// being rendered res.render()
app.set('views', path.join(__dirname, 'views'));

// Set view engine as EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParserErrorHandler());
app.use(express.static(__dirname));
app.use(helmet());
app.use(cors());

app.use('/User', userRouter);
app.use('/Pet', petRouter);
app.use('/Notification', notifcationRouter);
app.use('/Fcm', fcmRouter);
app.use('/CommunityPost', communityPostRouter);
app.use('/Bowl', bowlRouter);

app.set('port', process.argv[2] || process.env.PORT || 50007);
const server = app.listen(app.get('port'), () => {

	var dir = './uploadedFiles';
	if(!fs.existsSync(dir)) fs.mkdirSync(dir);	//업로드 폴더 유무 확인;

	console.log('Express server listening on port ' + app.get('port'));
});

// sequelize 연동
const client = globalRouter.client;
models.sequelize.sync().then( () => {
	console.log("Write DB Connect Success");


	
	models.User.findAll({
	}).then(result => {
		for(var i = 0 ; i < result.length; ++i){
			client.hmset(String(result[i].UserID), {
				"isOnline" : 0,
			});
		}	
	})

}).catch( err => {
    console.log("Write DB Connect Faield");
    console.log(err);
})

app.post('/', function(req, res) {
    const {data} = req.body;
    if(data === 'ping'){
        console.log(req.body);
        res.status(200).send('pong');
        return;
    }

    console.log(req.body);
    res.status(200).send('send me ping');
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

var storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, 'files/');
	},
	filename(req, file, cb) {
		cb(null, `${Date.now()}__${file.originalname}`);
	}
});

var upload = multer({ dest: 'files/'});
var uploadWithOriginalFilename = multer({ storage : storage});

app.post('/file_upload', function(req, res, next) {
    var fields = new Map();
    var fields_array = []; //배열에 저장해서 넘기기
    // 텍스트 값
    var files = [];
    var files_array = []; //배열에 저장해서 넘기기
	// 이미지 파일
	
	var form = new formidable.IncomingForm();
	form.encoding = 'utf-8';
	form.uploadDir = __dirname + "/files";

    form.on('field', function (field, value) { //값 하나당 한번씩 돌아가므로,
		console.log(field);
		fields.set(field, value);
		fields_array.push(value); //값 순서대로 배열에 쌓아준다.
	  });
	
	  form.on('file', function (field, file) {
		files.push([field, file.name]);
		console.log("what is file name in form.on file", file.name);
		files_array.push(file);
	  }).on('end', function() {
		console.log("file upload done");
		for(var i = 0 ; i < files_array.length; ++i){
			if (i < files_array.length) {
				fs_extra.rename(files_array[i].path, './files/' + files_array[i].name); //파일 앞서 만든 폴더에 저장
			 
			}
		}

		res.json(files_array[0]);
	  }).on('error', function (err) { //에러나면, 파일저장 진행된 id 값의 폴더 하위부분을 날려버릴까?
        res.json(null);
	});
	
	form.parse(req, function (error, field, file) { 
		console.log('[parse()] error : ' + error + ', field : ' + field + ', file : ' + file);
		console.log('upload success');
	  });
});

let version =  "v0.1";

app.post('/Check/Version', function(req, res) {
	fs.readFile(__dirname + "/files" + "/version.txt", 'utf-8', function(err, data) {
		if(err){
			console.log(err);
			res.json({"msg" : "version.txt file is wrong"});
			return;
		}else{
			console.log(data);
			res.json({"msg" : data});
		}
	})
});

app.post('/Check/Alive' , async function(req, res) {
	//배터리 잔량 update
	models.BowlDeviceTable.update(
		{
			Battery : req.body.bat
		},
		{
			where : { 
				PetID : req.body.id,
				Type: req.body.bowlType
			}
		}
	)

	if(req.body.bat <= 1){
		var pet = await models.Pet.findOne(
			{
					attributes: ["UserID"],
					where : {id : req.body.id}
			}
	   );

	   var bodyMessage = ((req.body.bowlType == 0 ? "밥 그릇" : "물 그릇") + "의 기기 배터리가 얼마 남지 않았어요.");

        var data = JSON.stringify({
            userID : 1,             //마이베프
            targetID : pet.UserID,
            title : "기기 알림",
            type : "NEED_BATTERY_CHECK",
            tableIndex : req.body.id,	//펫 아이디
            body : bodyMessage,
            isSend : 0          //1은 로그인 할 때 처리
		})
		
		if(await fcmFuncRouter.SendFcmEvent( data )){
        }else{
            console.log('Schedule/Do/CheckIntakes fcm is failed');
        }
	}

	res.json({"msg" : "OK"});
});


app.post('/OnResume', async(req, res) => {
	client.hmset(String(req.body.userID), {
		"isOnline" : 1,
	});

	res.status(200).send(true);
})

app.post('/OnPause', async(req, res) => {
	client.hmset(String(req.body.userID), {
		"isOnline" : 0,
	});

	res.status(200).send(true);
})

const axios = require('axios');
app.get("/certifications/redirect", async (req, res) => {
	res.status(200).send(true);
})

app.post("/certifications/check", async (req, res) => {
	try {
		// 인증 토큰 발급 받기
		const getToken = await axios({
		  url: "https://api.iamport.kr/users/getToken",
		  method: "post", // POST method
		  headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
		  data: {
			imp_key: "0291562377159414", // REST API키
			imp_secret: "315230864b907e5d4103fc1e7d5fde4b62201092bdf482decb0cfd5153856b0244c89f0a484ebbc5" // REST API Secret
		  }
		});
		
		const { access_token } = getToken.data.response; // 인증 토큰
		// imp_uid로 인증 정보 조회
		const getCertifications = await axios({
		  url: "https://api.iamport.kr/certifications/" + req.body.imp_uid,
		  method: "get", // GET method
		  headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
		});
		const certificationsInfo = getCertifications.data.response; // 조회한 인증 정보
		res.status(200).send(certificationsInfo);
		//res.redirect('/certifications/check?result=' + true);
	  } catch(e) {
		console.error(e);
		//res.redirect('/certifications/check?result=' + false);
		res.status(404).send(null);
	  }
})

app.post("/Fixed/FeedID", async( req, res) => {
	await models.Pet.findAll({

	}).then(result => {
		console.log('fixed feedid err');

		for(var i = 0 ; i < result.length; ++i){
			result[i].update({
				FoodID : 0
			})
		}

		res.status(200).send(true);
	}).catch(err => {
		console.log('fixed feedid err');
		res.status(404).send(null);
	})
});

var appVersion = "1.0.0";
app.post('/Check/AppVersion', async(req, res) => {
	if(req.body.version == appVersion){
		res.status(200).send(true);
	}else{
		res.status(200).send(false);
	}
})

app.post('/Test', async(req, res) => {
	let fill = await models.Intake.findOne({
		where : {
				PetID : req.body.petID,
				BowlType : req.body.bowlType,
				State : 1
		},
		order : [
		['id', 'DESC']
	],
	});

	let eat = await models.Intake.findOne({
			where : {
					PetID : req.body.petID,
					BowlType : req.body.bowlType,
					State : 3
			},
			order : [
		['id', 'DESC']
	],
	});

	//밥을 주기만 했으면
	if(globalRouter.IsEmpty(eat)){
			res.status(200).send(true);
	}else{
			var resData = {
				"res" : (eat.Amount - eat.BowlWeight) / (fill.Amount - fill.BowlWeight)
			}

			res.status(200).send(resData);
	}
});

const models_pro = require('./models/index_pro');
models_pro.sequelize.sync().then( () => {
	console.log("Write pro DB Connect Success");
});

var request = require('request');
var download = function(uri, filename, callback){
	request.head(uri, function(err, res, body){
	  console.log('content-type:', res.headers['content-type']);
	  console.log('content-length:', res.headers['content-length']);
  
	  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
	});
  };

var s3Url = 'http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com';

const s3MulterPro = require('./routes/multer_pro');
const { Op } = require('sequelize');

app.post('/Data/Transfer/To/ProvideDB', async(req, res) => {
	await models.User.findOne({
		where : {
			UserID : req.body.userID
		},
		include : [
			{
					model : models.Pet,
					required : true,
					limit: 99,
					order : [
						['Index', 'ASC']
					],
					include : [
						{
								model : models.PetPhoto,
								required : true,
								limit : 5,
								order : [
												['Index', 'ASC']
								]
						},
						{
								model : models.BowlDeviceTable,
								required : true,
								limit : 2,  //밥그릇, 물그릇
								order : [
												['id', 'DESC']
								],
								where : {
									[Op.not] : { BowlWeight : 0},
								}
						},
					]
			}
		]
	}).then(async result => {
		await models_pro.User.create({
			Email : result.Email,
			Password : result.Password,
			LoginType : result.LoginType,
			NickName : result.NickName,
			Location : result.Location,
			Information : result.Information,
			RealName : result.RealName,
			PhoneNumber :result.PhoneNumber,
			ProfileURL : result.ProfileURL,
			Sex : result.Sex,
			Birthday : result.Birthday,
			MarketingAgree : result.MarketingAgree,
			MarketingAgreeTime : result.MarketingAgreeTime,
			LoginState : result.LoginState,
			RefreshToken : result.RefreshToken,
		}).then(async result2 => {
			console.log('transfer user data success');

			globalRouter.makeFolder('./AllPhotos/PersonalPhotos/' + result2.UserID);

			//이미지 
			download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/ProfilePhotos/' + result.UserID + '/' + result.ProfileURL, './AllPhotos/PersonalPhotos/' + result2.UserID + '/' + result2.ProfileURL, function(){
				console.log('profile image done');

				s3MulterPro.formidablePathUpload('./AllPhotos/PersonalPhotos/' + result2.UserID + '/' + result2.ProfileURL, 'ProfilePhotos/' + result2.UserID + '/' + result2.ProfileURL);
			});

			for(var i = 0 ; i < result['Pets'].length ; ++i){
				await models_pro.Pet.create({
					UserID : result2.UserID,
					Index : result['Pets'][i].Index,
					Type : result['Pets'][i].Type,
					Name : result['Pets'][i].Name,
					Birthday : result['Pets'][i].Birthday,
					Kind : result['Pets'][i].Kind,
					Weight : result['Pets'][i].Weight,
					Sex : result['Pets'][i].Sex,
					PregnantState : result['Pets'][i].PregnantState,
					ObesityState : result['Pets'][i].ObesityState,
					Disease : result['Pets'][i].Disease,
					Allergy : result['Pets'][i].Allergy,
					FoodID : result['Pets'][i].FoodID,
					FoodCalorie : result['Pets'][i].FoodCalorie,
					FoodWater : result['Pets'][i].FoodWater,
					FoodRecommendedIntake : result['Pets'][i].FoodRecommendedIntake,
					WaterRecommendedIntake : result['Pets'][i].WaterRecommendedIntake,
					WeightRecommended : result['Pets'][i].WeightRecommended,
				}).then(async resultPet => {
					for(var j = 0 ; j < result['Pets'][i]['PetPhotos'].length ; ++j){
						await models_pro.PetPhoto.create({
							PetID : resultPet.id,
							Index : j * 1,
							ImageURL : result['Pets'][i]['PetPhotos'][j].ImageURL
						}).then(resultPetPhoto => {
							globalRouter.makeFolder('./AllPhotos/PetPhotos/' + resultPet.id);

							//이미지 
							download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/PetPhotos/' + result['Pets'][i].id + '/' + resultPetPhoto.ImageURL, './AllPhotos/PetPhotos/' + resultPet.id + '/' + resultPetPhoto.ImageURL, function(){
								console.log('petphoto image done');


								s3MulterPro.formidablePathUpload('./AllPhotos/PetPhotos/' + resultPet.id + '/' + resultPetPhoto.ImageURL, 'PetPhotos/' + resultPet.id + '/' + resultPetPhoto.ImageURL);
							});
						})
					}

					//그릇
					for(var j = 0 ; j < result['Pets'][i]['BowlDeviceTables'].length; ++j){
						await models_pro.BowlDeviceTable.create({
							PetID : resultPet.id,
							UUID : result['Pets'][i]['BowlDeviceTables'][j].UUID,
							BowlWeight : result['Pets'][i]['BowlDeviceTables'][j].BowlWeight,
							Type : result['Pets'][i]['BowlDeviceTables'][j].Type,
							Battery : result['Pets'][i]['BowlDeviceTables'][j].Battery,
						})
					}

					//사료
					await models.Intake.findAll({
						where : {
							PetID : result['Pets'][i].id
						}
					}).then(async resultIntake => {
						for(var j = 0; j < resultIntake.length ; ++j){
							await models_pro.Intake.create({
								PetID : resultPet.id,
								FoodID : resultIntake[j]['FoodID'],
								BowlWeight : resultIntake[j]['BowlWeight'],
								Amount : resultIntake[j]['Amount'],
								BowlType : resultIntake[j]['BowlType'],
								State : resultIntake[j]['State']
							})
						}
					})

					//간식
					await models.IntakeSnack.findAll({
						where : {
							PetID : result['Pets'][i].id
						}
					}).then(async resultIntakeSnack=> {
						for(var j = 0; j < resultIntakeSnack.length ; ++j){
							await models_pro.IntakeSnack.create({
								PetID : resultPet.id,
								SnackID : resultIntakeSnack[j]['SnackID'],
								Amount : resultIntakeSnack[j]['Amount'],
								Water : resultIntakeSnack[j]['Water'],
								Calorie : resultIntakeSnack[j]['Calorie'],
								Time : resultIntakeSnack[j]['Time'],
							})
						}
					})
				})
			}


			res.status(200).send(true);
		}).catch(err => {
			console.log('transfer user data failed' + err);
			res.status(404).send(false);
		})
	}).catch(err => {
		console.log('transfer user data failed' + err);
		res.status(404).send(false);
	})
});

app.post('/Image/Transfer/User', async(req, res) => {

	var user = await models.User.findOne({
		where : {
			UserID : req.body.userID
		},
	});

	globalRouter.makeFolder('./AllPhotos/ProfilePhotos/' + user.UserID);

	//이미지 
	download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/ProfilePhotos/' + user.UserID + '/' + user.ProfileURL, './AllPhotos/ProfilePhotos/' + user.UserID + '/' + user.ProfileURL, function(){
		console.log('profile image done');

		s3MulterPro.formidablePathUpload('./AllPhotos/ProfilePhotos/' + user.UserID + '/' + user.ProfileURL, 'ProfilePhotos/' + user.UserID + '/' + user.ProfileURL);
	});

	res.status(200).send(true);
});

app.post('/Image/Transfer/Pet', async(req, res) => {

	var pet = await models.Pet.findOne({
		where : {
			id : req.body.petID
		},
		include : [
			{
					model : models.PetPhoto,
					required : true,
					limit : 5,
					order : [
									['Index', 'ASC']
					]
			},
		]
	});

	globalRouter.makeFolder('./AllPhotos/PetPhotos/' + pet.id);

	console.log(pet.PetPhotos[0]);

	for(var i = 0 ; i < pet.PetPhotos.length ; ++i){

		if(req.body.down == 0){
			//이미지 
			download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/PetPhotos/' + pet.id + '/' + pet.PetPhotos[i].ImageURL, './AllPhotos/PetPhotos/' + pet.id + '/' + pet.PetPhotos[i].ImageURL, function(){
				console.log('pet image done');
			});
		}else{
			s3MulterPro.formidablePathUpload('./AllPhotos/PetPhotos/' + pet.id + '/' + pet.PetPhotos[i].ImageURL, 'PetPhotos/' + pet.id + '/' + pet.PetPhotos[i].ImageURL);
		}
	}

	res.status(200).send(true);
});

app.post('/Image/Transfer/Community', async(req, res) => {

	await models.CommunityPost.findAll({
		where : {
			IsShow : 1,
			[Op.not] : { ImageURL1 : null},
		}
	}).then(result => {

		for(var i = 0 ; i < result.length; ++i){
			globalRouter.makeFolder('./AllPhotos/CommunityPhotos/' + result[i].id);

			if(req.body.download == 0){
				download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL1, './AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL1, function(){
					console.log('CommunityPhotos image done');
				});
			}else{
				s3MulterPro.formidablePathUpload('./AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL1, 'CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL1);
			}
		}
	})

	await models.CommunityPost.findAll({
		where : {
			IsShow : 1,
			[Op.not] : { ImageURL2 : null},
		}
	}).then(result => {

		for(var i = 0 ; i < result.length; ++i){
			if(req.body.download == 0){
				download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL2, './AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL2, function(){
					console.log('CommunityPhotos image done');
				});
			}else{
				s3MulterPro.formidablePathUpload('./AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL2, 'CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL2);
			}
		}
	})

	await models.CommunityPost.findAll({
		where : {
			IsShow : 1,
			[Op.not] : { ImageURL3 : null},
		}
	}).then(result => {

		for(var i = 0 ; i < result.length; ++i){
			if(req.body.download == 0){
				download('http://myvfdevbucket.s3.ap-northeast-2.amazonaws.com' + '/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL3, './AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL3, function(){
					console.log('CommunityPhotos image done');
				});
			}else{
				s3MulterPro.formidablePathUpload('./AllPhotos/CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL3, 'CommunityPhotos/' + result[i].id + '/' + result[i].ImageURL3);
			}
		}
	})

	res.status(200).send(true);
});