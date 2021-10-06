const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');


module.exports = {
        SelectByID : async function SelectByID( communityID ) {
                return new Promise(async (resolv, reject) => {
                        await models.CommunityPost.findOne({
                                include: [
                                        { 
                                                model : models.CommunityPostLike , 
                                                required: true, 
                                                limit: 99,
                                        },
                                ],
                                where : {
                                        id : communityID
                                }
                        }).then(async result => {
        
                                var replies = await models.CommunityPostReply.findAll({where : {PostID : result.id}});
                                var repliesLength = replies.length;
                                var community = result;
                
                                var data = {
                                        community,
                                        repliesLength,
                                }
                
                                resolv(data);
                        }).catch(err => {
                                console.log('CommunityPost GetPostByID Failed' + err);
                                resolv(null);
                        })
                });
            }
};
