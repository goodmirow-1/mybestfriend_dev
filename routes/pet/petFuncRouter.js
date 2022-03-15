const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');

        const moment = require('moment');
        const s3Multer = require('../multer');

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

module.exports = {
        SelectByID : async function SelectByID( petID ) {
                return new Promise((resolv, reject) => {
                    models.Pet.findOne({
                            where : {
                                    id : petID
                            },
                            include : [
                                    {
                                        model : models.PetPhoto,
                                        required : true,
                                        limit : 5,
                                    },
                                    {
                                        model : models.BowlDeviceTable,
                                        required : true,
                                        limit : 2,  //밥그릇, 물그릇
                                        order : [
                                                        ['id', 'DESC']
                                        ]
                                },
                            ]
                    }).then(result => {
                            resolv(result);
                    }).catch(err => {
                        globalRouter.logger.error('Pet SelectBYID findOne Failed ' + err);
                        resolv(null);
                    })
                });
            },
        DestroyCauseOfExitMember : async function DestroyCauseOfExitMember( userID ) {
                return new Promise(async (resolv, reject) => {
                        var petList = await models.Pet.findAll({
                                where : {
                                    UserID : userID
                                }
                            }).catch(err => {
                                console.log('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                            })

                        for(var i = 0 ; i < petList.length; ++i){
                                var pet = petList[i];
                        
                                //디바이스 연결 정보 초기화
                                await models.BowlDeviceTable.update(
                                        {
                                        PetID : null,
                                        },
                                        {
                                        where : { PetID : pet.id}
                                        }
                                ).catch(err => {
                                        globalRouter.logger.error('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                })
                        
                                //섭취정보 삭제
                                await models.Intake.destroy({
                                        where : {
                                        PetID : pet.id
                                        }
                                }).catch(err => {
                                        globalRouter.logger.error('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                })
                        
                                var photoList = await models.PetPhoto.findAll({
                                        where : {
                                        PetID : pet.id
                                        }
                                }).catch(err => {
                                        globalRouter.logger.error('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
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
                                        globalRouter.logger.error('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                })

                                //펫 삭제
                                await models.Pet.destroy({
                                        where : {
                                                id : pet.id
                                        }
                                }).catch(err => {
                                        globalRouter.logger.error('PetFuncRouter DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                })
                        }

                        resolv(false);
                });
        }
};
