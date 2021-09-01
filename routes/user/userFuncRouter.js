const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');

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
            }
};
