const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');


module.exports = {
    Insert : async function InsertNotification( data ) {
        return new Promise((resolv, reject) => {
            models.NotificationList.create({
                UserID: data.userID,
                TargetID : data.targetID,
                Type : data.type,
                IsSend : data.isSend,
                TableIndex : data.tableIndex,
                SubIndex : data.subIndex,
            }).then( result => {
                console.log('InsertNotification create Success ' + result);
                resolv(result);
            }).catch( err => {
                globalRouter.logger.error('InsertNotification create Faield ' + err);
                resolv(null);
            })
        });
    }
};
