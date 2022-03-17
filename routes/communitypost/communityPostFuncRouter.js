const router = require('express').Router(),
        models = require('../../models'),
        globalRouter = require('../global');
        const s3Multer = require('../multer');

const { Op } = require('sequelize');

const LIKES_LIMIT = 100;
const POPULAR_BASE = 5;//인기글 최소 기준

module.exports = {
        SelectByID : async function SelectByID( communityID ) {
                return new Promise(async (resolv, reject) => {
                        await models.CommunityPost.findOne({
                                include: [
                                        { 
                                                model : models.CommunityPostLike , 
                                                required: true, 
                                                limit: LIKES_LIMIT,
                                        },
                                        {
                                                model: models.CommunityPostReply,
                                                required: true,
                                                limit: LIKES_LIMIT
                                        }
                                ],
                                where : {
                                        id : communityID,
                                        IsShow : 1
                                }
                        }).then(async result => {
                                if(globalRouter.IsEmpty(result)){
                                        resolv(null);
                                }else{
                                        var declares = await models.CommunityPostDeclare.findAll({where : {TargetID : result.id}});
                                        var declareLength = declares.length;
                                        var community = result;
        
                                        var user = await models.User.findOne(
                                                {
                                                        attributes: [ 
                                                                "UserID", "NickName", "ProfileURL"
                                                        ],
                                                        where : {UserID : result.UserID}
                                                }
                                        );
        
                                        var userID = user.UserID;
                                        var nickName = user.NickName;
                                        var profileURL = user.ProfileURL;
        
                                        var data = {
                                                userID,
                                                nickName,
                                                profileURL,
                                                community,
                                                declareLength
                                        }
                        
                                        resolv(data);
                                }
                        }).catch(err => {
                                console.log('CommunityPost GetPostByID Failed' + err);
                                reject(null);
                        })
                });
            },
        DestroyCauseOfExitMember : async function DestroyCauseOfExitMember( userID ) {
                return new Promise(async (resolv, reject) => {
                             var communityList = await models.CommunityPost.findAll({where : { UserID : userID}}).catch(err => {
                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                             });

                             for(var i = 0 ; i < communityList.length ; ++i){
                                var community = communityList[i];

                                var replyList = await models.CommunityPostReply.findAll({where : { PostID : community.id}}).catch(err => {
                                        globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                     });

                                for(var j = 0 ; j < replyList.length; ++j){
                                        var reply = replyList[j];

                                        var replyreplyList = await models.CommunityPostReplyReply.findAll({where : { ReplyID : reply.id}}).catch(err => {
                                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                                resolv(true);
                                             });

                                        for(var k = 0 ; k < replyreplyList.length; ++k){
                                                var replyreply = replyreplyList[k];

                                                //대댓글 신고 삭제
                                                await models.CommunityPostReplyReplyDeclare.destroy({ where : {TargetID : replyreply.id}}).catch(err => {
                                                        globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                                        resolv(true);
                                                     });
                                        }

                                        //대댓글 삭제
                                        await models.CommunityPostReplyReply.destroy({where : {ReplyID : reply.id}}).catch(err => {
                                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                                resolv(true);
                                             });

                                        //댓글 신고 삭제
                                        await models.CommunityPostReplyDeclare.destroy({where : { TargetID : reply.id}}).catch(err => {
                                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                                resolv(true);
                                             });

                                        //대댓글 구독자 삭제
                                        await models.CommunityReplySubscriber.destroy({where : { ReplyID : reply.id}}).catch(err => {
                                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                                resolv(true);
                                             });
                                }

                                //게시글 좋아요 삭제
                                await models.CommunityPostLike.destroy({where : { PostID : community.id}}).catch(err => {
                                        globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                     });        

                                //게시물 구독자 삭제
                                await models.CommunityPostSubscriber.destroy({where : { PostID : community.id}}).catch(err => {
                                        globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                     });        

                                //게시글 댓글 삭제
                                await models.CommunityPostReply.destroy({where : { PostID : community.id}}).catch(err => {
                                        globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                        resolv(true);
                                     });

                                //사진 데이터 삭제
                                if(community.ImageURL1 != null) s3Multer.fileDelete('CommunityPhotos/' + community.id, community.ImageURL1 );
                                if(community.ImageURL2 != null) s3Multer.fileDelete('CommunityPhotos/' + community.id, community.ImageURL2 );
                                if(community.ImageURL3 != null) s3Multer.fileDelete('CommunityPhotos/' + community.id, community.ImageURL3 );
                             }

                             await models.CommunityPostLike.destroy({
                                where : { UserID : userID, }
                             }).catch(err => {
                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                             });

                        //      //게시글 신고 삭제
                        //      await models.CommunityPostDeclare.destroy({
                        //         where : {
                        //                 UserID : userID,
                        //         }
                        //      }).catch(err => {
                        //         globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                        //         resolv(true);
                        //      });

                        //      await models.CommunityPostReplyDeclare.destroy({
                        //         where : {
                        //                 UserID : userID,
                        //         }
                        //         }).catch(err => {
                        //                 globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                        //                 resolv(true);
                        //         });

                        //         await models.CommunityPostReplyReplyDeclare.destroy({
                        //                 where : {
                        //                         UserID : userID,
                        //                 }
                        //         }).catch(err => {
                        //            globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                        //            resolv(true);
                        //         });
                        

                             //내가 쓴 대댓글 삭제
                             await models.CommunityPostReplyReply.destroy({where : {UserID : userID}}).catch(err => {
                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                             });

                                //내가 쓴 댓글 삭제
                             await models.CommunityPostReply.destroy({where : {UserID : userID}}).catch(err => {
                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                             });

                             //게시글 삭제
                             await models.CommunityPost.destroy({where : { UserID : userID}}).catch(err => {
                                globalRouter.logger.error('Community DestroyCauseOfExitMember Failed ' + err);
                                resolv(true);
                             });




                             resolv(false);
                });
        }
};
