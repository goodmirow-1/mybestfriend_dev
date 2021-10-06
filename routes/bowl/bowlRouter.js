const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');

const { Op } = require('sequelize');
const client = globalRouter.client;

let URL = '/Bowl';

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
                                PetID : req.body.petID,
                                UUID : req.body.uuid,
                                Type : req.body.type
                        }
                }).then(result => {
                        console.log(URL + '/Register/BowlInfo BowlDeviceTable create findOrCreate Success');

                        //이미 있으면
                        if(result[1] == false){
                                result[0].update({
                                        PetID : req.body.petID,
                                        Type: req.body.type
                                })
                        }

                        res.status(200).send(true);
                }).catch(err => {
                        console.log(URL + '/Register/BowlInfo BowlDeviceTable create findOrCreate Failed ' + err);
                        res.status(404).send(null);
                })
        }
})

router.post('/Disconnect/Pet', async(req, res) => {
        await models.BowlDeviceTable.update(
                {
                        PetID : null
                },
                {
                        where : {
                                id : req.body.id
                        }
                }
        ).then(result => {
                console.log(URL + '/Disconnect/Pet BowlDeviceTable update Success');
                res.status(200).send(true);
        }).catch(err => {
                console.log(URL + '/Disconnect/Pet BowlDeviceTable update Failed ' + err);
                res.status(404).send(null);
        })
});

router.post('/Update/BowlWeight', async(req,res) => {
        await models.BowlDeviceTable.update(
                {
                        BowlWeight : req.body.bowlWeight,
                },
                {
                        where : {
                                id : req.body.id
                        }
                }
        ).then(result => {
                console.log(URL + '/Update/BowlWeight weight update Success');
                res.status(200).send(result);
        }).catch(err => {
                console.log(URL + '/Update/BowlWeight weight update Failed ' + err);
                res.status(404).send(null);
        })
})

router.post('/Insert/Intake', async(req,res) => {
        await models.Intake.create({
                PetID : req.body.petID,
                BowlWeight : req.body.bowlWeight,
                Amount : req.body.amount,
                Wobble : req.body.wobble,
                BowlType : req.body.bowlType,
                State : req.body.state,
        }).then(result => {
                console.log(URL + '/Insert/Intake Intake create Success');
                res.status(200).send(result);
        }).catch(err => {
                console.log(URL + '/Insert/Intake Intake create Failed ' + err);
                res.status(404).send(null);
        })
})

router.post('/Select/IntakeByPetID', async(req, res) => {
        await models.Intake.findAll({
                where : {
                        PetID : req.body.petID,
                        BowlType : req.body.bowlType,
                }
        }).then(result => {
                console.log(URL + '/Select/IntakeByID Intake findAll Success');
                res.status(200).send(result);
        }).catch(err => {
                console.log(URL + '/Select/IntakeByID Intake findAll Failed ' + err);
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

router.post('/Insert/Log', async(req, res) => {
        await models.Errlog.create({
                PetID : req.body.petID,
                Message : req.body.m
        }).then(result => {
                console.log(URL + '/Insert/Log Errlog create Success');
                res.status(200).send(result);
        }).catch(err => {
                console.log(URL + '/Insert/Log Errlog create Failed ' + err);
                res.status(404).send(null);
        })
})

router.get('/Select/Log', async(req, res) => {
        await models.Errlog.findAll({

        }).then(result => {
                console.log(URL + '/Insert/Log Errlog findAll Success');
                res.status(200).send(result);
        }).catch(err => {
                console.log(URL + '/Insert/Log Errlog findAll Failed ' + err);
                res.status(404).send(null);
        })
})

module.exports = router;