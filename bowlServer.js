const express = require('express');
const methodOverride = require('method-override');              //Post,Delete,Update 관련 Module
const bodyParser = require('body-parser');                      //Json으로 데이터 통신 Module
const helmet = require('helmet');                               //http 보안관련 Module
const moment = require('moment');

const formidable = require('formidable');
const fs_extra = require('fs-extra');
const path = require('path');
const fs = require('fs');
const bodyParserErrorHandler = require('express-body-parser-error-handler')

const models = require("./models/index.js");
const logger = require("./libs/myWinston");

const redis = require('redis');
const client = redis.createClient(6379, "myvefredis-emtpy-cluster.wt3zqd.0001.apn2.cache.amazonaws.com");

const fcmFuncRouter = require('./routes/fcm/fcmFuncRouter'),
        bowlRouter = require('./routes/bowl/bowlRouter'),
                fcmRouter = require('./routes/fcm/fcmRouter');

const app = express();

// Require static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParserErrorHandler());
app.use(express.static(__dirname));
app.use(helmet());

app.use('/Fcm', fcmRouter);
app.use('/Bowl', bowlRouter);

app.set('port', process.argv[2] || process.env.PORT || 50008);

const server = app.listen(app.get('port'), () => {
        console.log('Express server listening on port ' + app.get('port'));
});

app.get('/test', function(req,res) {
        res.status(200).send(app.get('port'));
});


// sequelize 연동
models.sequelize.sync().then( () => {
        console.log("DB Connect Success");
}).catch( err => {
    console.log("DB Connect Faield");
    console.log(err);
})


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