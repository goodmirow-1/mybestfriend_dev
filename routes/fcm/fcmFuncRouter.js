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

                        //식사 알림 차단
                        if(result.Eating == false){
                                isBanType = true;
                        }

                        //분석 알림 차단
                        if(result.Analysis == false){
                                isBanType = true;
                        }

                        //한마디 알림 차단
                        if(result.Advice == false){
                                isBanType = true;
                        }

                        //커뮤니티 알림 차단
                        if(result.Community == false){
                                isBanType = true;
                        }

                        //마케팅 알림 차단
                        if(result.Marketing == false){
                                isBanType = true;
                        }

                        var message = data.title + " : " + data.body;

                        var tableStr = globalRouter.IsEmpty(fcmData.TableIndex) ? 0 : fcmData.TableIndex;
                        var uuidStr = globalRouter.IsEmpty(fcmData.UUID) ? '' : fcmData.UUID;
                        var date = moment().format('yyyy-MM-DD HH:mm:ss');
                        if(globalRouter.IsEmpty(fcmData) == false)
                                res = fcmData.id + "|" + fcmData.UserID + '|' + fcmData.TargetID + '|' + fcmData.Type + '|' + uuidStr + '|' + tableStr + '|' + date;
         
                        let sendMsg;
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
                                        token : result.Token,
                                }
                        }

                        console.log(sendMsg);

                        admin.messaging().send(sendMsg)
                         .then( result => {
                             console.log('fcm send is success' + result);
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
