const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');


const { Op } = require('sequelize');

module.exports = {
        SelectByUserID : async function SelectByUserID( userID ) {
                return new Promise((resolv, reject) => {
                    models.User.findOne({
                            where : {
                                    UserID : userID
                            },
                    }).then(result => {
                            console.log('User SelectByUserID findOne Success');
                            resolv(result);
                    }).catch(err => {
                        globalRouter.logger.error('User SelectByUserID findOne Failed ' + err);
                        resolv(null);
                    })
                });
            },
        SelectWithPetByUserID : async function SelectWithPetByUserID( userID ) {
                return new Promise((resolv, reject) => {
                        models.User.findOne({
                                where : {
                                        UserID : userID
                                },
                                include : [
                                        {
                                                model : models.Pet,
                                                required : true,
                                                limit: 99,
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
                                                    },
                                                    {
                                                            model : models.BowlDeviceTable,
                                                            required : true,
                                                            limit : 2,  //밥그릇, 물그릇
                                                            order : [
                                                                            ['id', 'DESC']
                                                            ],
                                                            where : {
                                                                [Op.not] : { BowlWeight : 0},
                                                            }
                                                    },
                                                ]
                                        }
                                    ]
                        }).then(result => {
                                console.log('User SelectWithPetByUserID findOne Success');
                                resolv(result);
                        }).catch(err => {
                            globalRouter.logger.error('User SelectWithPetByUserID findOne Failed ' + err);
                            resolv(null);
                        })
                    });
        }
};
