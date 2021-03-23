const express = require('express');
const methodOverride = require('method-override');		//Post,Delete,Update 관련 Module
const bodyParser = require('body-parser');			//Json으로 데이터 통신 Module
const helmet = require('helmet');				//http 보안관련 Module

const models = require("./models/index.js");
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const app = express();

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(helmet());

app.set('port', process.argv[2] || process.env.PORT || 50000);
const server = app.listen(app.get('port'), () => {
	console.log('Express server listening on port ' + app.get('port'));

});

// sequelize 연동
models.sequelize.sync().then( () => {
	console.log("DB Connect Success");
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
		console.log('Closed out rmaining connections');
		process.exit(0);
	});

	setTimeout(() => {
		console.log('Could not close connections in time, forcefully shutting down');
		process.exit(1);
	}, 10000);
}

app.get('/TEST', function(req, res, next) {
	var upload_folder = '업로드 폴더 경로';
	//var file = upload_folder + req.body.file_name; // ex) /upload/files/sample.txt
	
	var	file = '../files/abc.txt';

	try {
	  if (fs.existsSync(file)) { // 파일이 존재하는지 체크
		var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
		var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴
	  
		res.setHeader('Content-disposition', 'attachment; filename=' + filename); // 다운받아질 파일명 설정
		res.setHeader('Content-type', mimetype); // 파일 형식 지정
	  
		var filestream = fs.createReadStream(file);
		filestream.pipe(res);
	  } else {
		res.send('해당 파일이 없습니다.');  
		return;
	  }
	} catch (e) { // 에러 발생시
	  console.log(e);
	  res.send('파일을 다운로드하는 중에 에러가 발생하였습니다.');
	  return;
	}
  });
