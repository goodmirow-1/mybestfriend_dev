const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');

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
                            console.log('Pet SelectBYID findOne Success');
                            resolv(result);
                    }).catch(err => {
                        globalRouter.logger.error('Pet SelectBYID findOne Failed ' + err);
                        resolv(null);
                    })
                });
            }
};
