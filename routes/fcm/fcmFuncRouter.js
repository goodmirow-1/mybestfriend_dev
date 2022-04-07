const router = require('express').Router(),
        models = require('../../models'),
        admin = require('firebase-admin'),
        moment = require('moment'),
        globalRouter = require('../global');

        notificationFuncRouter = require('../notification/notificationFuncRouter');

module.exports = {
        SendFcmEvent : async function SendFcmEvent( body ) {
                var data = JSON.parse(body);

                await models.FcmTokenList.findOne({
                    where : {
                        UserID : data.targetID
                    },
                    
                    order : [
                        ['id', 'DESC']
                    ]
                }).then( async result => {
                        if (globalRouter.IsEmpty(result)) {
                                globalRouter.logger.error('fcmFuncRouter UserID' + data.targetID + ' Token is worng');
                                return false;
                        }

                        var fcmData = data;
                        var page = 'NOTIFICATION';

                        fcmData = await notificationFuncRouter.Insert(data);

                        var isBanType = false;

                        switch(data.type){
                                case "POST_LIKE":
                                case "POST_REPLY":
                                case "POST_REPLY_RELY":
                                {
                                        if(result.Community == false) isBanType = true;
                                }
                                break;
                                case "PET_BOWL_IS_EMPTY":
                                case "PET_EAT_DONE":
                                {
                                        if(result.Eating == false) isBanType = true;
                                }
                                break;
                        }

                        if(data.type == "POST_LIKE" || data.type == "POST_REPLY"){
                                page = 'COMMUNITY';
                        }else if(data.type == "POST_REPLY_REPLY"){
                                page = 'COMMUNITY_REPLY_REPLY';
                        }else if(data.type == "PET_BOWL_IS_EMPTY" || data.type == "PET_EAT_DONE"){
                                page = 'BOWL';
                        }

                        var message = data.title + " : " + data.body;

                        var tableStr = globalRouter.IsEmpty(fcmData.TableIndex) ? 0 : fcmData.TableIndex;
                        var subStr = globalRouter.IsEmpty(fcmData.SubIndex) ? '' : fcmData.SubIndex;
                        var date = moment().format('yyyy-MM-DD HH:mm:ss');
                        if(globalRouter.IsEmpty(fcmData) == false)
                                res = fcmData.id + "|" + fcmData.UserID + '|' + fcmData.TargetID + '|' + fcmData.Type + '|' + tableStr + '|' + subStr + '|' + date;
         
                        let sendMsg;
                        var badgeCount = Number(result.BadgeCount + 1);
                        if(data.isSend == 1 || isBanType == true){
                                sendMsg = {
                                        data : {
                                                title : "마이베프",
                                                notibody : message,
                                                body : res,
                                                click_action : "FLUTTER_NOTIFICATION_CLICK",
                                                screen: page
                                        },
                                        token : result.Token,
                                }
                                badgeCount = 0;
                        }else{
                                sendMsg = {
                                        notification : {
                                                title : "마이베프",
                                                body : message,
                                        },
                                        data : {
                                                body : res,
                                                click_action : "FLUTTER_NOTIFICATION_CLICK",
                                                screen: page
                                        },
                                        apns: {
                                                payload: {
                                                  aps: {
                                                    badge: badgeCount,
                                                    sound: 'default',
                                                  },
                                                },
                                            },
                                        token : result.Token,
                                }
                        }

                        await admin.messaging().send(sendMsg)
                         .then( fcmResult => {
                                result.update({BadgeCount : badgeCount});
                                console.log('fcm send is success' + fcmResult);
                             return true;
                         })
                         .catch( e => {
                             globalRouter.logger.error(e);
                             return false; 
                         })
                         
                }).catch( err => {
                        globalRouter.logger.error('FcmTokenList Select Faield ' + err);
                        return false;
                })
        }
};
