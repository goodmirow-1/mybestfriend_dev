const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');

const client = globalRouter.client;

let URL = '/Notification';

router.post('/UnSendSelect', async (req, res) => {
    await models.NotificationList.findAll({
        where : {
            TargetID : req.body.userID,
            IsSend : 0
        }    
    }).then(result => {

        let value = {
            IsSend : 1,
        }

        for(let i = 0 ; i < result.length; ++i){
            result[i].update(value).then(result2 => {
            })
        }

        res.status(200).send(result);
    }).catch(err => {
        globalRouter.logger.error(URL + "UnSendSelect error" + err);
        res.status(400).send(null);
    });
});

module.exports = router;