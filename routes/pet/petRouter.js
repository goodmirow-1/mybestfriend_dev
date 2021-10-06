const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        globalRouter = require('../global');

const s3Multer = require('../multer');
const petFuncRouter = require('./petFuncRouter');

const client = globalRouter.client;

let URL = '/Pet';

router.post('/Select/ID', async(req, res) => {
        res.status(200).send(await petFuncRouter.SelectByID(req.body.id));
})

router.post('/Select/UserID', async(req, res) => {
	await models.Pet.findAll({
		where : {
                        UserID : req.body.userID,
		},
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
                        }
		]
        }).then(result => {
                console.log(URL + '/Select/UserID Pet findAll Success');
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/InsertOrModify PetPhoto findOne Failed ' + err);
                res.status(400).send(null);
        })
})

router.post('/InsertOrModify', async(req, res) => {     //펫 수정

        console.log(URL + '/InsertOrModify Do');

        var fields = new Map();

        var file_id_values = [];
        var remove_id_values = [];

        var files = [];

        var form = new formidable.IncomingForm();

        form.encoding = 'utf-8';
        form.uploadDir = './AllPhotos/Temp';
        form.multiples = true;
        form.keepExtensions = true;
      
        form.on('field', function (field, value) { //값 하나당 한번씩 돌아가므로,
          console.log(field);
          fields.set(field, value);
          if(field == 'removeidlist') remove_id_values.push(value);
          else if(field == 'fileidlist') file_id_values.push(value);
        });

        form.on('file', function (field, file) {
                if(field == 'images') files.push(file);
                else console.log('this file has no fieldname');
        }).on('end', async function() {

                if(fields.get('isCreate') == 1){
                        console.log(URL + '/InsertOrModify create flow');

                        await models.Pet.create(
                                {
                                        UserID : fields.get('userID'),
                                        Index : fields.get('index'),
                                        Type : fields.get('type'),
                                        Name : fields.get('name'),
                                        Birthday : fields.get('birthday'),
                                        Kind : fields.get('kind'),
                                        Weight : fields.get('weight'),
                                        Sex : fields.get('sex'),
                                }
                        ).then(async result => {
                                console.log(URL + '/InsertOrModify create success');

                                for(var i = 0 ; i < files.length; ++i){
                                        var index = i * 1;
                                        var fileName = Date.now() + '.' + files[index].name.split('.').pop();

                                        s3Multer.formidableFileUpload(files[index], 'PetPhotos/' + result.id + '/' + fileName);

                                        await models.PetPhoto.create({
                                                PetID : result.id,
                                                Index : i * 1,
                                                ImageURL : fileName
                                        }).then(petPhotoResult => {
                                                console.log(URL + '/InsertOrModify PetPhoto create success');
                                        }).catch(err => {
                                                globalRouter.logger.error(URL + '/InsertOrModify PetPhoto create Failed ' + err);
                                        })
                                }

                                res.status(200).send(await petFuncRouter.SelectByID(result.id));
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/InsertOrModify Pet create Failed ' + err);
                                res.status(400).send(null);
                        })
                }else{  //수정인 경우
                        console.log(URL + '/InsertOrModify update flow');

                        await models.Pet.update(
                                {
                                        Name : fields.get('name'),
                                        Birthday : fields.get('birthday'),
                                        Kind : fields.get('kind'),
                                        Weight : fields.get('weight'),
                                        Sex : fields.get('sex'),
                                        Disease : fields.get('disease'),
                                        Allergy : fields.get('allergy')
                                },
                                {
                                        where : {
                                                id : fields.get('id')
                                        }
                                }
                        ).then(async result => {
                                console.log(URL + '/InsertOrModify pet update is success');
                                if(file_id_values.length == 0 && remove_id_values.length == 0 && files.length == 0){
                                        console.log(URL + '/InsertOrModify files related data is empty');
                                }else{
                                        //데이터 삭제
                                        for(var i = 0 ; i < remove_id_values.length; ++i){
                                                await models.PetPhoto.findOne({
                                                        where : {
                                                                id : remove_id_values[i]
                                                        }
                                                }).then(petPhotoResult => {
                                                        console.log(URL + '/InsertOrModify PetPhoto remove id list findone success');
        
                                                        s3Multer.fileDelete('PetPhotos/' + fields.get('id') , petPhotoResult.ImageURL);
        
                                                        petPhotoResult.destroy({}).then(petPhotoDestroyResult => {
                                                                console.log(URL + '/Modify PetPhoto Destroy Success');
                                                        }).catch(err => {
                                                                console.log(URL + '/Modify PetPhoto Destroy failed' + err);
                                                        })
                                                }).catch(err => {
                                                        globalRouter.logger.error(URL + '/InsertOrModify PetPhoto findOne Failed ' + err);
                                                })
                                        }
        
                                        //기존 데이터 인덱스 수정
                                        for(var i = 0 ; i < file_id_values.length; ++i){
                                                await models.PetPhoto.update(
                                                        {
                                                                Index : i * 1
                                                        },
                                                        {
                                                                where : {
                                                                        id : file_id_values[i]
                                                                }
                                                        }
                                                ).then(petPhotoResult => {
                                                        console.log(URL + '/InsertOrModify PetPhoto index update success');
                                                }).catch(err => {
                                                        globalRouter.logger.error(URL + '/InsertOrModify PetPhoto index update Failed ' + err);
                                                })
                                        }
        
                                        //새로운 데이터 생성
                                        for(var i = file_id_values.length ; i < file_id_values.length + files.length; ++i){
        
                                                var index = i - file_id_values.length;
                                                var fileName = Date.now() + '.' + files[index].name.split('.').pop();
        
                                                s3Multer.formidableFileUpload(files[index], 'PetPhotos/' + fields.get('id') + '/' + fileName);
        
                                                await models.PetPhoto.create({
                                                        PetID : fields.get('id'),
                                                        Index : i * 1,
                                                        ImageURL : fileName
                                                }).then(petPhotoResult => {
                                                        console.log(URL + '/InsertOrModify PetPhoto createsuccess');
                                                }).catch(err => {
                                                        globalRouter.logger.error(URL + '/InsertOrModify PetPhoto create Failed ' + err);
                                                })
                                        }
                                }
        
                                res.status(200).send(await petFuncRouter.SelectByID(fields.get('id')));
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/InsertOrModify Pet update Failed ' + err);
                                globalRouter.removefiles('./AllPhotos/Temp/');
                                res.status(400).send(null);
                        })
                }
        }).on('error', function (err) { //에러나면, 파일저장 진행된 id 값의 폴더 하위부분을 날려버릴까?
                globalRouter.logger.error('[error] error ' + err);
                globalRouter.removefiles('./AllPhotos/Temp/');
                res.status(400).send(null);
        });
    
        //end 이벤트까지 전송되고 나면 최종적으로 호출되는 부분
        //임시 폴더 삭제는 주기적으로 한번씩 삭제가 필요함 언제할지는 의문.
        form.parse(req, function (error, field, file) {
                console.log('[parse()] error : ' + error + ', field : ' + field + ', file : ' + file);
                console.log(URL + '/InsertOrModify success');
        });
});

router.post('/Insert/UserCustomFood', async(req, res) => {
        await models.UserFoodTypeTable.findOrCreate({
                where : {
                        BrandName : req.body.brandName,
                        KoreaName: req.body.koreaName,
                        EnglishName : req.body.englishName
                },
                defaults : {
                        BrandName : req.body.brandName,
                        KoreaName: req.body.koreaName,
                        EnglishName : req.body.englishName,
                        PerProtine : req.body.perProtine,
                        PerFat : req.body.perFat,
                        Carbohydrate : req.body.carbohydrate,
                        Calorie: req.body.calorie
                }
        }).then(result => {
                console.log(URL + '/Insert/UserCustomFood UserFoodTypeTable create findOrCreate Success');

                res.status(200).send(true);
        }).catch(err => {
                console.log(URL + '/Insert/UserCustomFood UserFoodTypeTable create findOrCreate Failed ' + err);
                res.status(404).send(null);
        })
})

module.exports = router;