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

const userRouter = require('./routes/user/userRouter'),
		petRouter = require('./routes/pet/petRouter'),
		notifcationRouter = require('./routes/notification/notificationRouter'),
		fcmRouter = require('./routes/fcm/fcmRouter'),
		communityPostRouter = require('./routes/communitypost/communityPostRouter'),
		bowlRouter = require('./routes/bowl/bowlRouter');

const globalRouter = require('./routes/global');

const app = express();

var moment = require('moment');
var jobList= [];
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

app.set('view engine', 'ejs');
app.use(expressEjsLayout);
app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(helmet());

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
models.sequelize.sync().then( () => {
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

	jobList.push(job);
}).catch( err => {
    console.log("DB Connect Faield");
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
		process.exit(1);
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

let sendDataList = [];

app.post('/Send/Data', function(req, res) {
	let body = req.body; 

	if(globalRouter.IsEmpty( JSON.stringify(body))){
		console.log('/Send/Data is empty');
		res.json({"msg" : "NO"});
	}else{

		var data = {
			ID : body.ID,
			Weight : body.Weight,
			Wobble : body.Wobble,
			Time : moment().format('YYYY-MM-DD HH:mm:ss')
		  };

		console.log(body);
		sendDataList.push(data);
		res.json({"msg" : "OK"});
	}
});

app.get('/Get/Data', function(req, res) {
	res.json(sendDataList.reverse());
});

let version =  "v0.1";

app.post('/Check/Version', function(req, res) {
	if(globalRouter.IsEmpty( req.body.uuid )){
		console.log('/Check/Living is empty');
		res.json({"msg" : "EMPTY"});
	}else{
		console.log(req.body.uuid);

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
	}
});


app.get('/Schedule/TempPhotoClear', function(req, res) {
	var job = schedule.scheduleJob('00 00 11 * * *', function() {
		let mNow = new Date();
		console.log('remove temp folder call');
		console.log(mNow);
		globalRouter.removefiles('./AllPhotos/Temp/');
	});

	jobList.push(job);
	res.status(200).send(true);
});

app.get('/Schedule/Cancel' , function(req, res) {
	for(var i = 0 ; i < jobList.length; ++i){
		jobList[i].cancel();
	}
});


const client = globalRouter.client;
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

const s3Multer = require('./routes/multer');
app.post('/Test', async(req, res) => {
	await models.User.findOne({
        where : {
            Email : req.body.email
        },
        include : [
            {
                    model : models.Pet,
					required : true,
					limit: 99,
                    order : [
                                    ['id', 'DESC']
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
                                ]
                        },
		            ]
            }
        ]
    }).then(result => {
        console.log(URL + '/DebugLogin User findOne is Success');
            //로그인 정보가 없을 때
        if(globalRouter.IsEmpty(result)){
            res.status(200).send(null);
            return;
        }else{
            const payload = {
                Email : req.body.email
            };

            const secret = tokenController.getSecret(ACCESS_TOKEN);
            const refsecret = tokenController.getSecret(REFRESH_TOKEN);
        
            const token = tokenController.getToken(payload, secret, ACCESS_TOKEN);
            const reftoken = tokenController.getToken(payload, refsecret, REFRESH_TOKEN);
            console.log("refreshtoken:" + reftoken);

            let value = {
                RefreshToken: reftoken 
              }
          
            var resData = {
                result,
                AccessToken: token,
                RefreshToken: reftoken,
                AccessTokenExpiredAt: (tokenController.getExpired(token) - 65000).toString(),
            };

            result.update(value).then(result2 => {
                res.status(200).send(resData);
            }).catch(err => {
                console.log(URL + '/DebugLogin User Update is failed' + err);
                res.status(400).send(null);
            })
        }
    }).catch(err => {
        globalRouter.logger.error(URL + '/DebugLogin User findOne is Failed' + err);
        res.status(400).send(null);
    })
})