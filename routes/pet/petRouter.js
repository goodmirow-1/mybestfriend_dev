const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        globalRouter = require('../global');

const s3Multer = require('../multer');
const petFuncRouter = require('./petFuncRouter');
const verify = require('../../controllers/parameterToken');

const client = globalRouter.client;
var moment = require('moment');
const { Op } = require('sequelize');

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
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/InsertOrModify PetPhoto findOne Failed ' + err);
                res.status(400).send(null);
        })
})

router.post('/Index/Reorder', async(req, res) => {

        var fields = new Map();

        var pet_id_values = [];
        var pet_index_values = [];

        var form = new formidable.IncomingForm();

        form.encoding = 'utf-8';
        form.uploadDir = './AllPhotos/Temp';
        form.multiples = true;
        form.keepExtensions = true;

        form.on('field', function (field, value) { //값 하나당 한번씩 돌아가므로,
                fields.set(field, value);
                if(field == 'petidlist') pet_id_values.push(value);
                else if(field == 'petindexlist') pet_index_values.push(value);
        }).on('end', async function() {

                var isCheck = true;
                for(var i = 0 ; i < pet_id_values.length; ++ i){
                        await models.Pet.update(
                                {
                                        Index : pet_index_values[i]
                                },
                                {
                                        where : {
                                                id : pet_id_values[i],
                                                UserID : fields.get('userID'),
                                        }
                                }
                        ).then(result => {
                                
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Index/Reorder error ' + err);
                                isCheck = false;
                        })
                }

                res.status(200).send(isCheck);
        }).on('error', function (err) { //에러나면, 파일저장 진행된 id 값의 폴더 하위부분을 날려버릴까?
                globalRouter.logger.error('[error] error ' + err);
                res.status(400).send(null);
        });

        //end 이벤트까지 전송되고 나면 최종적으로 호출되는 부분
        //임시 폴더 삭제는 주기적으로 한번씩 삭제가 필요함 언제할지는 의문.
        form.parse(req, function (error, field, file) {
                console.log('[parse()] error : ' + error + ', field : ' + field + ', file : ' + file);
                console.log(URL + '/Index/Reorder success');
        });
});

router.post('/Delete',  require('../../controllers/verifyToken'), async(req, res) => {
        var pet = await models.Pet.findOne({
                where : {
                        id : req.body.petID,
                        //UserID : req.body.userID
                }
        });

        if(globalRouter.IsEmpty(pet)){
                res.status(200).send(null);
        }else{
                var isCheck = true;

                //디바이스 연결 정보 초기화
                await models.BowlDeviceTable.update(
                        {
                        PetID : null,
                        },
                        {
                        where : { PetID : pet.id}
                        }
                ).catch(err => {
                        globalRouter.logger.error(URL + '/Delete BowlDeviceTable  update Failed ' + err);
                        isCheck = false;
                })

                //섭취정보 삭제
                await models.Intake.destroy({
                        where : {
                        PetID : pet.id
                        }
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Delete Intake  destroy Failed ' + err);
                        isCheck = false;
                })

                var photoList = await models.PetPhoto.findAll({
                        where : {
                        PetID : pet.id
                        }
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Delete PetPhoto  findAll Failed ' + err);
                        isCheck = false;
                })

                for(var j = 0 ; j < photoList.length ; ++j){
                        var photo = photoList[j];
                        //db데이터 삭제
                        s3Multer.fileDelete('PetPhotos/' + pet.id , photo.ImageURL);
                }

                //사진데이터 삭제
                await models.PetPhoto.destroy({
                        where : {
                                PetID : pet.id
                        }
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Delete PetPhoto  destroy Failed ' + err);
                        isCheck = false;
                })

                //펫 삭제
                await models.Pet.destroy({
                        where : {
                                id : pet.id
                        }
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Delete Pet  destroy Failed ' + err);
                        isCheck = false;
                })

                res.status(200).send(isCheck);
        }
})

router.post('/InsertOrModify', async(req, res) => {     //펫 수정

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
          fields.set(field, value);
          if(field == 'removeidlist') remove_id_values.push(value);
          else if(field == 'fileidlist') file_id_values.push(value);
        });

        form.on('file', function (field, file) {
                if(field == 'images') files.push(file);
                else console.log('this file has no fieldname');
        }).on('end', async function() {
                if(await verify.verifyToken(fields.get('accessToken')) == false){
                        if(fields.get('isCreate') == 1){
                                res.status(404).send(null);        
                        }else{
                                res.status(200).send(await petFuncRouter.SelectByID(fields.get('id')));
                        }
                }else{
                        if(fields.get('isCreate') == 1){
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
                                                PregnantState : fields.get('pregnantState'),
                                                ObesityState : fields.get('obesityState'),
                                                FoodID : fields.get('foodID'),
                                                FoodCalorie : fields.get('foodCalorie'),
                                                FoodWater :fields.get('foodWater'),
                                                FoodRecommendedIntake : fields.get('foodRecommendedIntake'),
                                                WaterRecommendedIntake : fields.get('waterRecommendedIntake'),
                                                WeightRecommended : fields.get('WeightRecommended')
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
                                await models.Pet.update(
                                        {
                                                Name : fields.get('name'),
                                                Birthday : fields.get('birthday'),
                                                Kind : fields.get('kind'),
                                                Weight : fields.get('weight'),
                                                Sex : fields.get('sex'),
                                                PregnantState : fields.get('pregnantState'),
                                                ObesityState : fields.get('obesityState'),
                                                Disease : fields.get('disease'),
                                                Allergy : fields.get('allergy'),
                                                FoodID : fields.get('foodID'),
                                                FoodCalorie : fields.get('foodCalorie'),
                                                FoodWater :fields.get('foodWater'),
                                                FoodRecommendedIntake : fields.get('foodRecommendedIntake'),
                                                WaterRecommendedIntake : fields.get('waterRecommendedIntake'),
                                                WeightRecommended : fields.get('WeightRecommended')
                                        },
                                        {
                                                where : {
                                                        id : fields.get('id')
                                                }
                                        }
                                ).then(async result => {
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
                
                                                                s3Multer.fileDelete('PetPhotos/' + fields.get('id') , petPhotoResult.ImageURL);
                
                                                                petPhotoResult.destroy({}).then(petPhotoDestroyResult => {
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
                        UserID : req.body.userID,
                        BrandName : req.body.brandName,
                        KoreaName: req.body.koreaName,
                        EnglishName : req.body.englishName,
                        PerProtein : req.body.perProtein,
                        PerFat : req.body.perFat,
                        Carbohydrate : req.body.carbohydrate,
                        Water : req.body.water,
                        Calorie: req.body.calorie
                }
        }).then(result => {
                res.status(200).send(true);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Insert/UserCustomFood UserFoodTypeTable create findOrCreate Failed ' + err);
                res.status(404).send(null);
        })

})


router.post('/Select/TodayIntake', async(req, res) => {

        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        BowlType : req.body.bowlType,
                        [Op.not] : { State : 1},
                        createdAt : { 
                                [Op.gt]: new Date().setHours(0, 0, 0, 0),
                                [Op.lt]: new Date()
                        },
                }
        }).then(async result => {

                var resData = [];
                if(globalRouter.IsEmpty(result)){
                        res.status(200).send(null);
                }else{
                        //먹은 후 값이 처음이면
                        if(result[0].State == 3){
                                 var prev = await models.Intake.findOne({
                                        order : [
                                                ['id', 'DESC']
                                        ],
                                         where : {
                                                id : {
                                                        [Op.lt] : result[0].id,
                                                },
                                                [Op.or] : {
                                                        State : 2,
                                                },
                                                PetID : req.body.petID,
                                                BowlType : req.body.bowlType
                                        }
                                 })

                                 resData.push(prev);
                                 for(var i = 0 ; i < result.length ; ++i){
                                        resData.push(result[i]);
                                 }

                                 res.status(200).send(resData);
                        }else{
                                res.status(200).send(result);
                        }
                }
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/TodayIntake Failed' + err);
                res.status(404).send(null);
        })
})

router.post('/Select/TodayFillIntake', async(req, res) => {
        await models.Intake.findOne({
                where : {
                        PetID : req.body.petID,
                        State : 1, //밥 줌
                        BowlType : 0, //밥그릇
                        createdAt : { 
                                [Op.gt]: new Date().setHours(0, 0, 0, 0),
                                [Op.lt]: new Date()
                        },
                }
        }).then(async result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/TodayIntake Failed' + err);
                res.status(404).send(null);
        })
})

router.post('/Select/IntakeData', async(req, res) => {
        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        id : {
                                [Op.gt] : req.body.id
                        },
                },
                limit : 50000,
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/InTakeData Failed' + err);
                res.status(404).send(null);
        })
})

router.post('/Insert/IntakeSnack', async(req, res) => {
        await models.IntakeSnack.create({
                PetID : req.body.petID,
                SnackID : req.body.snackID,
                Amount : req.body.amount,
                Water : req.body.water,
                Calorie: req.body.calorie,
                Time : new Date(req.body.time)
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Insert/IntakeSnack Failed' + err);
                res.status(404).send(null);
        })
})

router.post('/Select/IntakeSnack', async(req, res) => {
        await models.IntakeSnack.findAll({
                where : {
                        PetID : req.body.petID,
                        id : {
                                [Op.gt] : req.body.id
                        },
                },
                limit : 50000,
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/IntakeSnack Failed' + err);
                res.status(404).send(null);
        })
})


router.post('/Select/IntakeDataTest', async(req, res) => {
        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        id : {
                                [Op.gt] : req.body.id
                        },
                },
                limit : 50000,
        }).then(result => {
                res.status(200).send(true);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/InTakeData Failed' + err);
                res.status(404).send(false);
        })
})

module.exports = router;