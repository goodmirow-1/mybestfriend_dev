const router = require('express').Router(),
        models = require('../../models'),
        fcmFuncRouter = require('../fcm/fcmFuncRouter'),
        globalRouter = require('../global');

const { Op } = require('sequelize');
const client = globalRouter.client;
var moment = require('moment');
const verify = require('../../controllers/parameterToken');

let URL = '/Bowl';
const { promisify } = require("util");
const getallAsync = promisify(client.hgetall).bind(client);

router.post('/Register/Info', async(req, res) => {
        if(globalRouter.IsEmpty(req.body.uuid)){
                console.log(URL + '/Register/BowlInfo UUID is Empty');
                res.status(404).send(null);
        }else{
                await models.BowlDeviceTable.findOrCreate({
                        where : {
                                UUID : req.body.uuid
                        },
                        defaults : {
                                PetID : req.body.pi,
                                UUID : req.body.uuid,
                                Type : req.body.type,
                                Battery : req.body.bat
                        }
                }).then(result => {
                        //이미 있으면
                        if(result[1] == false){
                                result[0].update({
                                        PetID : req.body.pi,
                                        Type: req.body.type,
                                        BowlWeight: 0.0,
                                        Battery : 5
                                })
                        }

                        res.status(200).send(true);
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Register/BowlInfo BowlDeviceTable create findOrCreate Failed ' + err);
                        res.status(404).send(null);
                })
        }
})

router.post('/Disconnect/Pet', require('../../controllers/verifyToken'), async(req, res) => {

        var bowl = await models.BowlDeviceTable.findOne({
                where : {id : req.body.id}
        })

        bowl.update(
                {
                        PetID : null,
                        BowlWeight: 0.0
                },
                {
                        where : {
                                id : req.body.id
                        }
                }
        ).then(result => {
                res.status(200).send(true);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Disconnect/Pet BowlDeviceTable update Failed ' + err);
                res.status(404).send(null);
        })
});

router.post('/Update/BowlWeight', async(req,res) => {
        await models.BowlDeviceTable.update(
                {
                        BowlWeight : req.body.bw,
                },
                {
                        where : {
                                PetID : req.body.id
                        }
                }
        ).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Update/BowlWeight weight update Failed ' + err);
                res.status(404).send(null);
        })
})

router.post('/Insert/Intake', async(req,res) => {

        console.log(moment().format("HH:mm:ss") + " / pID : " + req.body.pi + " / bt : " + req.body.bt + " / bw : " + req.body.bw + " / at : " + req.body.fa + " / st : " + req.body.et + " / bat: " + req.body.bat);

        let bowl = await models.BowlDeviceTable.findOne({
                where : {
                        PetID : req.body.pi,
                        Type : req.body.bt
                }
        });

        //연결되어있는 펫이 없으면
        if(globalRouter.IsEmpty(bowl)){
                console.log(URL + ' bowl is disconnected');
                res.status(200).send(false);
        }else{
                bowl.update({Battery : req.body.bat});

                var pet = await models.Pet.findOne({
                        where : {id : req.body.pi}
                });
                
                await models.Intake.create({
                        PetID : req.body.pi,
                        FoodID : pet.FoodID,
                        BowlWeight : req.body.bw,
                        Amount : req.body.fa,
                        BowlType : req.body.bt,
                        State : req.body.et,
                }).then(async result => {

                        //무게와 양의 차이가 50이하일 때
                        if(Math.abs(req.body.fa - req.body.bw) < 50){
                                let fill = await models.Intake.findOne({
                                        where : {
                                                        PetID : req.body.pi,
                                                        BowlType : req.body.bt,
                                                        State : 1
                                        },
                                        order : [
                                                ['id', 'DESC']
                                        ],
                                });
                        
                                let eat = await models.Intake.findOne({
                                                where : {
                                                                PetID : req.body.pi,
                                                                BowlType : req.body.bt,
                                                                State : 3
                                                },
                                                order : [
                                                ['id', 'DESC']
                                        ],
                                });

                                var ratio = (eat.Amount - eat.BowlWeight) / (fill.Amount - fill.BowlWeight);

                                //밥 준거 대비 5프로 이하이면
                                if(ratio <= 0.05){
                                        var getAllRes = await getallAsync(String(pet.UserID));

                                        if(getAllRes != null){
                                                var title = req.body.bw == 0 ? "밥" : "물" + " 그릇 알림";
                                                var bodyhead = pet.Name + "의 그릇이 비었어요. ";
                                                var bodytail =  (req.body.bw == 0 ? "밥" : "물") + " 그릇을 채워주세요.";

                                                var data = JSON.stringify({
                                                        userID : 1,
                                                        targetID : pet.UserID,
                                                        title : title,
                                                        type : "PET_BOWL_IS_EMPTY",
                                                        tableIndex : pet.id,
                                                        body : bodyhead + bodytail,
                                                        isSend : getAllRes.isOnline,
                                                })

                                                if(fcmFuncRouter.SendFcmEvent(data)){
                                                        console.log(URL + '/InsertOrModify POST_NEW_UPDATE fcm is true');
                                                }else{
                                                        console.log(URL + '/InsertOrModify POST_NEW_UPDATE fcm is false');
                                                }
                                        }
                                }
                        }

                        res.status(200).send(true);
                }).catch(err => {
                        globalRouter.logger.error(URL + '/Insert/Intake Intake create Failed ' + err);
                        res.status(404).send(null);
                })
        }
})

router.post('/Select/IntakeByPetID', async(req, res) => {
        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        BowlType : req.body.bowlType,
                }
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/IntakeByID Intake findAll Failed ' + err);
                res.status(200).send(null);
        })
})

router.post('/Select/Recent/Intake', async(req, res) => {
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
                if(globalRouter.IsEmpty(fill)){
                        res.status(200).send(false);                       
                }else{
                        res.status(200).send(fill);                       
                }
        }else{
                let resData = await models.Intake.findAll({
                        where : {
                                id : {
                                        [Op.between] : [fill.id, eat.id]
                                },
                                PetID : req.body.petID,
                                BowlType : req.body.bowlType,
                        }
                });
        
                if(globalRouter.IsEmpty(resData)){
                        resData = fill;
                }
        
                res.status(200).send(resData);
        }
})

router.post('/Select/Recent/EmtpyBowl', async(req, res) => {
        await models.Intake.findOne({
                where : {
                        PetID : req.body.petID,
                        BowlType : req.body.bowlType,
                        State : 4
                },
                order : [
			['id', 'DESC']
		],
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/Recent/EmtpyBowl Intake findOne Failed ' + err);
                res.status(404).send(null);
        });
});

router.post('/Insert/Log', async(req, res) => {
        await models.Errlog.create({
                PetID : req.body.petID,
                Message : req.body.m
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Insert/Log Errlog create Failed ' + err);
                res.status(404).send(null);
        })
})

router.get('/Select/Log', async(req, res) => {
        await models.Errlog.findAll({

        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/Log Errlog findAll Failed ' + err);
                res.status(404).send(null);
        })
})

router.post('/Select/BowlInfo', async (req, res) => {
        await models.User.findOne({
            where : {
                UserID : req.body.userID
            },
            include : [
                {
                    model : models.Pet,
                    required : false,
                    limit : 10,
                    order : [
                            ['Index', 'ASC']
                    ],
                    include : [
                                {
                                        model : models.BowlDeviceTable,
                                        required : false,
                                        limit : 2,  //밥그릇, 물그릇
                                        order : [
                                                        ['id', 'DESC']
                                        ]
                                },
                        ]
                }
            ]
        }).then(result => {
            res.status(200).send(result);
        }).catch(err => {
            globalRouter.logger.error(URL + '/Select/User findOne is Failed' + err);
            res.status(400).send(null);
        })
})

router.post('/Select/BowlWeight', async(req, res) => {
        await models.BowlDeviceTable.findOne({
                where : {
                        PetID : req.body.petID,
                        Type : req.body.type
                }
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/User findOne is Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/Select/LastFill', async(req, res) => {
        await models.Intake.findOne({
                where : {
                        PetID : req.body.petID,
                        State : 1
                },
                order : [
                        ['id', 'DESC']
                ],
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/LastFill findOne is Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/Check/IntakeInfo', async(req, res) => {
        var bowlDevices = await models.BowlDeviceTable.findAll({
                where : {
                        PetID : req.body.petID,
                }
        });

        if(globalRouter.IsEmpty(bowlDevices)){
                res.status(200).send(false);
        }else{
                var resData = [];
                for(var i = 0 ; i < bowlDevices.length ; ++i){
                        await models.Intake.findAll({
                                where : {
                                        PetID : req.body.petID,
                                        BowlType : bowlDevices[i].Type,
                                        createdAt : { 
                                        //24시간 이내
                                        [Op.gte] : moment().subtract(24, 'H').toDate()
                                        },
                                }
                        }).then(result => {
                                if(globalRouter.IsEmpty(result)){
                                        var bowlType = bowlDevices[i].Type;
                                        resData.push(bowlType);
                                }
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Check/IntakeInfos findAll is Failed' + err);
                                res.status(400).send(null);
                        })
                }

                if(globalRouter.IsEmpty(resData)){
                        res.status(200).send(false);
                }else{
                        res.status(200).send(true);
                }
        }
});
  
router.post('/Select/IntakeAll' , async(req, res) => {
        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        BowlType : req.body.bowlType
                },
                order : [
                        ['id', 'DESC']
                ],
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/IntakeAll findAll is Failed' + err);
                res.status(400).send(null);
        })
});

router.get('/Select/TestBowlInfo', async(req, res) => {
        await models.BowlDeviceTable.findOne({
                where : {id : 1}
        }).then(result => {
                res.status(200).send(result);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/TestBowlInfo findOne is Failed' + err);
                res.status(400).send(null);
        })
})

module.exports = router;