const router = require('express').Router(),
        admin = require('firebase-admin'),
        models = require('../../models'),
        globalRouter = require('../global');

const { Op } = require('sequelize');

const client = globalRouter.client;

var serviceAccount = require("../../keys/myvef-bowl-firebase-adminsdk-lmhrd-25e0fa3d39.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://myvef-bowl.firebaseio.com"
});

let URL = '/Fcm';

router.post('/Token/Save',async (req,res) => {
    let token = req.body['token'];
    let userID = req.body['userID'];

    var fcm = models.FcmTokenList.findOne({
        where : {
            UserID : userID,
            Token : token
        }
    })

    if(globalRouter.IsEmpty(fcm)){
        globalRouter.CreateOrUpdate(models.FcmTokenList, 
            {
                UserID : userID
            },
            {
                UserID : userID,
                Token : token,
            }
        ).then(function(result) {
            console.log(URL + "Token/Save Success" + result);
            res.status(200).send(result);
        }).catch( err => {
            globalRouter.logger.error(URL + "Token/Save Faield " + err);
            res.status(400).send(err);
        })
    }else{
        let eating = fcm.Eating;
        let analysis = fcm.Analysis;
        let advice = fcm.Advice;
        let community = fcm.Community;
        let marketing = fcm.Marketing;
        let badgeCount = fcm.BadgeCount;

        await models.FcmTokenList.destroy({
            where: {
                Token : token,
                UserID: {
                    [Op.ne]: userID
                }
            }
        }).then( function(result, err) {
            if(err) console.log(URL + 'Token/Save Destroy Failed' + err);
            else{
                console.log(URL + 'Token/Save Destroy success' + result);
            }
        })

        globalRouter.CreateOrUpdate(models.FcmTokenList, 
            {
                UserID : userID
            },
            {
                UserID : userID,
                Token : token,
                Eating : eating,
                Analysis : analysis,
                Advice : advice,
                Community : community,
                Marketing : marketing,
                BadgeCount : badgeCount
            }
        ).then(function(result) {
            console.log(URL + "Token/Save Success" + result);
            res.status(200).send(result);
        }).catch( err => {
            globalRouter.logger.error(URL + "Token/Save Faield " + err);
            res.status(400).send(err);
        })
    }
});

router.post('/DetailAlarmSetting', async(req,res) => {
    let body = req.body;

    await models.FcmTokenList.update(
        {
            Eating: body.eating,
            Analysis: body.analysis,
            Advice: body.advice,
            Community : body.community,
            Marketing: body.marketing
        },
        {
            where : {
                UserID : body.userID
            }
        },
    ).then( result => {
        console.log(URL + 'DetailAlarmSetting' + result);
        res.status(200).send(result);
    }).catch(err => {
        console.log(URL + 'DetailAlarmSetting' + err);
        res.status(400).send(null);
    })
});

module.exports = router;