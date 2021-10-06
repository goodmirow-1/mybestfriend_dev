const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        fcmFuncRouter = require('../fcm/fcmFuncRouter'),
        globalRouter = require('../global');

const s3Multer = require('../multer');
const communityPostFuncRouter = require('./communityPostFuncRouter');
const client = globalRouter.client;
const { Op } = require('sequelize');

let URL = '/CommunityPost';
const LIKES_LIMIT = 100;
const POPULAR_BASE = 5;//인기글 최소 기준

router.post('/Select', async(req, res) => {
        await models.CommunityPost.findAll({
                limit : 30,
                offset : req.body.index * 1,
		order : [
			['id', 'DESC']
                ],
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
                where: {
                        IsShow : 1,
                }
        }).then(async result => {
                console.log(URL + '/Select CommunityPost Success');

                let resData = [];

                for(var i = 0 ; i < result.length; ++i){
                        var declares = await models.CommunityPostDeclare.findAll({where : {TargetID : result[i].id}});
                        var declareLength = declares.length;
                        var community = result[i];

                        var user = await models.User.findOne(
                                {
                                        attributes: [ 
                                                "UserID", "NickName", "ProfileURL"
                                        ],
                                        where : {UserID : result[i].UserID}
                                }
                        );

                        var userID = user.UserID;
                        var nickName = user.NickName;
                        var profileURL = user.ProfileURL;

                        var temp = {
                                userID,
                                nickName,
                                profileURL,
                                community,
                                declareLength
                        }

                        resData.push(temp);
                }

                if(globalRouter.IsEmpty(resData))
                        resData = null;

                res.status(200).send(resData);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select CommunityPostReply findAll Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/Select/Popular', async(req, res) => {

        await models.CommunityPost.findAll({
                limit : 30,
                offset : req.body.index * 1,
                where : {
                        Type : 1
                },
                order : [
			['RegisterTime', 'DESC']
                ],
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
        }).then(async result => {
                console.log(URL + '/Select/Popular Success');

                let resData = [];

                for(var i = 0 ; i < result.length ; ++i){
                        var declares = await models.CommunityPostDeclare.findAll({where : {TargetID : result[i].id}});
                        var declareLength = declares.length;
                        var community = result[i];


                        var user = await models.User.findOne(
                                {
                                        attributes: [ 
                                                "UserID", "NickName", "ProfileURL"
                                        ],
                                        where : {UserID : result[i].UserID}
                                }
                        );

                        var userID = user.UserID;
                        var nickName = user.NickName;
                        var profileURL = user.ProfileURL;

                        var temp = {
                                userID,
                                nickName,
                                profileURL,
                                community,
                                declareLength
                        }

                        resData.push(temp);
                }

                if(globalRouter.IsEmpty(resData))
                        resData = null;

                res.status(200).send(resData);
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/Popular CommunityPopularID findAll Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/Select/ID', async(req, res) => {
        res.status(200).send(await communityPostFuncRouter.SelectByID(req.body.id));
})

router.post('/Select/Detail', async(req, res) => {
        await models.CommunityPost.findOne({
                where : {
                        id : req.body.id
                }
        }).then(async result => {
                console.log(URL + '/Select/Detail CommunityPost findOne Success');

                if(globalRouter.IsEmpty(result) || result.IsShow == 0){
                        console.log('empty or delete post');
                        res.status(200).send(null);
                }else{
                        await models.CommunityPostReply.findAll({
                                where : {
                                        PostID : req.body.id
                                },
                                include : [
                                        {
                                                attributes : ['id'],
                                                model : models.CommunityPostReplyDeclare,
                                                required : true,
                                                limit : LIKES_LIMIT
                                        },
                                        {
                                                model : models.CommunityPostReplyReply,
                                                required : true,
                                                limit : LIKES_LIMIT,
                                                include: [
                                                        {
                                                                model : models.CommunityPostReplyDeclare,
                                                                required : true,
                                                                limit : LIKES_LIMIT
                                                        }
                                                ]
                                        }
                                ]
                        }).then(result => {
                                console.log(URL + '/Select/Detial CommunityPostReply findAll Success');
                                res.status(200).send(result);
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Select/Detail CommunityPostReply findAll Failed');
                                res.status(400).send(null);
                        })
                }
        }).catch(err => {
                console.log(URL + '/Select/Detail CommunityPost findOne Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/InsertOrModify', async(req, res) => {
        console.log(URL + '/InsertOrModify Do');

        var fields = new Map();

        var remove_index_values = [];
        var image_url_values = [];
    
        var files = [];
    
        var form = new formidable.IncomingForm();
    
        form.encoding = 'utf-8';
        form.uploadDir = './AllPhotos/Temp';
        form.multiples = true;
        form.keepExtensions = true;

        form.on('field', function (field, value) { //값 하나당 한번씩 돌아가므로,
                console.log(field);
                fields.set(field, value);
                if(field == 'removeindexlist') remove_index_values.push(value);
                else if(field == 'imageurllist') image_url_values.push(value);
        });
          
        form.on('file', function (field, file) {
                if(field == 'images') files.push(file);
                else console.log('this file has no fieldname');
        }).on('end', async function() {
                if(fields.get('isCreate') == 1) {
                        console.log(URL + '/InsertOrModify CommunityPost Create Flow');

                        await models.CommunityPost.create({
                                UserID : fields.get('userID'),
                                Category : fields.get('category'),
                                Kind : fields.get('kind'),
                                Location : fields.get('location'),
                                Title : fields.get('title'),
                                Contents : fields.get('contents'),
                                PetType : fields.get('petType'),
                                IsShow: true
                        }).then(async result => {
                                console.log(URL + '/InsertOrModify create Success');

                                for(var i = 0 ; i < files.length ; ++i){

                                        var fileName = Date.now() + '.' + files[i].name.split('.').pop();

                                        s3Multer.formidableFileUpload(files[i], 'CommunityPhotos/' + result.id + '/' + fileName);
                                        if(i == 0){
                                                await result.update({ImageURL1 : fileName})
                                        }else if(i == 1){
                                                await result.update({ImageURL2 : fileName})
                                        }else{
                                                await result.update({ImageURL3 : fileName})
                                        }
                                }

                                res.status(200).send(await communityPostFuncRouter.SelectByID(result.id));
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/InsertOrModify CommunityPost create Failed ' + err);
                                res.status(400).send(null);
                        })
                }else {
                        console.log(URL + '/InsertOrModify CommunityPost Update Flow');

                        var community = await communityPostFuncRouter.SelectByID(fields.get('id'));

                        community = community['community'];
                        community.update(
                                {
                                        Title : fields.get('title'),
                                        Contents : fields.get('contents')
                                },
                                {
                                        where : {
                                                UserID : fields.get('userID')
                                        }
                                }
                        ).then(async communityPostResult => {
                                console.log(URL + '/InsertOrModify CommunityPost update Success');

                                //기존 이미지 파일 삭제
                                for(var i = 0 ; i < remove_index_values.length; ++i){
                                        var imageURL = community.ImageURL1;

                                        if(remove_index_values[i] == 2) imageURL = community.ImageURL2;
                                        else if(remove_index_values[i] == 3) imageURL = community.ImageURL3;

                                        s3Multer.fileDelete('CommunityPhotos/' + fields.get('id'), imageURL);
                                }

                                //기존 이미지 삭제
                                if(remove_index_values.length > 0){
                                        await community.update({
                                                ImageURL1 : null,
                                                ImageURL2 : null,
                                                ImageURL3 : null
                                        });
                                }

                                //기존 이미지 순서 변경
                                for(var i = 0 ; i < image_url_values.length; ++i){
                                        if(i == 0){
                                                await community.update({ImageURL1 : image_url_values[i]})
                                        }else if(i == 1){
                                                await community.update({ImageURL2 : image_url_values[i]})
                                        }else{
                                                await community.update({ImageURL3 : image_url_values[i]})
                                        }
                                }

                                //새로운 데이터 생성
                                for(var i = image_url_values.length ; i < image_url_values.length + files.length ; ++i){
                                        var index = i - image_url_values.length;
                                        var fileName = Date.now() + '.' + files[index].name.split('.').pop();

                                        s3Multer.formidableFileUpload(files[index], 'CommunityPhotos/' + fields.get('id') + '/' + fileName);

                                        if(i == 0){
                                                await community.update({ImageURL1 : fileName})
                                        }else if(i == 1){
                                                await community.update({ImageURL2 : fileName})
                                        }else{
                                                await community.update({ImageURL3 : fileName})
                                        }
                                }

                                res.status(200).send(await communityPostFuncRouter.SelectByID(fields.get('id')));
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/InsertOrModify CommunityPost update Failed ' + err);
                                res.status(400).send(null);
                        })
                }
        }).on('error', function (err) { //에러나면, 파일저장 진행된 id 값의 폴더 하위부분을 날려버릴까?
                globalRouter.logger.error('[error] error ' + err);
                globalRouter.removefiles('./AllPhotos/Temp/');
                res.status(400).send(null);
        });

        //end 이벤트까지 전송되고 나면 최종적으로 호출되는 부분
        //임시 폴더 삭제는 주기적으로 한번씩 삭제가 필요함 언제할지는 의문.
        form.parse(req, function (error, field, file) {
                console.log('[parse()] error : ' + error + ', field : ' + field + ', file : ' + file);
                console.log(URL + '/modify success');
        });
})

router.post('/Insert/Reply', async(req, res) => {
        let communityPost = await models.CommunityPost.findOne({
                where : {
                        id : req.body.postID
                }
        })

        if(globalRouter.IsEmpty(communityPost)){
                console.log(URL + '/Insert/Reply CommunityPost is Empty');
                res.status(404).send(null);
                return;
        }else{
                if(communityPost.IsShow == 0){
                        globalRouter.logger.error(URL + "/Insert/Reply is Empty or Delete Post");
                        res.status(404).send(null);
                        return;
                }else{
                        await models.CommunityPostReply.create({
                                UserID : req.body.userID,
                                PostID : req.body.postID,
                                Contents : req.body.contents
                        }).then( async result => {
                                console.log(URL + '/Insert/Reply create is success');

                                //작성한 댓글에 대한 알림 구독
                                await models.CommunityReplySubscriber.findOrCreate({
                                        where : {
                                                ReplyID : result.id,
                                                UserID : req.body.userID,
                                        },
                                        defaults: {
                                                ReplyID : result.id,
                                                UserID : req.body.userID
                                        }
                                }).then(subscriberResult => {
                                        console.log(URL + 'Insert/Reply CommunityReplySubscriber findOrCreate Success');
                                }).catch(err => {
                                        globalRouter.logger.error(URL + "/Insert/Reply CommunityReplySubscriber findOrCreate Failed" + err);
                                })

                                //FCM
                                await models.CommunitySubscriber.findAll({
                                        where : {
                                                PostID : req.body.postID
                                        }
                                }).then(async subResult => {
                                        console.log(URL + '/Insert/Reply CommunitySubscriber findAll Success');

                                        for(var i = 0 ; i < subResult.length; ++i){
                                                if(subResult[i].UserID == req.body.userID) continue;

                                                var tempData = subResult[i];
                                                client.hgetall(String(subResult[i].UserID), async function(err, obj) {
                                                        if(err) throw err;
                                                        if(obj == null) erturn;

                                                        var user = await models.user.findOne({where: {userID : req.body.userID}});

                                                        var data = JSON.stringify({
                                                                userID : req.body.userID,
                                                                inviteID : tempData.UserID,
                                                                title : "새로운 댓글",
                                                                type : "POST_REPLY",
                                                                tableIndex : req.body.postID,
                                                                body : user.NickName + "님이 댓글을 달았습니다.",
                                                                isSend : obj.isOnline,
                                                        })

                                                        if(fcmFuncRouter.SendFcmEvent(data)){
                                                                console.log(URL + '/Insert/Reply fcm is true');
                                                        }else{
                                                                console.log(URL + '/Insert/Reply fcm is false');
                                                        }
                                                })
                                        }
                                })

                                res.status(200).send(result);
                        }).catch(err => {
                                console.log(URL + '/Insert/Reply CommunitySubscriber findAll Failed' + err);
                                res.status(404).send(null);
                        })
                }
        }
})

router.post('/Insert/ReplyReply', async(req, res) => {
        let reply = await models.CommunityPostReply.findOne({
                where : {
                        id : req.body.replyID
                }
        })

        if(globalRouter.IsEmpty(reply)){
                console.log(URL + '/Insert/ReplyReply CommunityPostReply findOne is Empty');
                res.status(404).send(null);
        }else{
                let replyPost = await models.CommunityPost.findOne({
                        where : {
                                id : reply.PostID
                        }
                })

                if(globalRouter.IsEmpty(replyPost) || replyPost.IsShow == 0){
                        console.log(URL + '/Insert/ReplyReply CommunityPost findOne is Empty Or Delete');
                        res.status(404).send(null);
                }else{
                        await models.CommunityPostReplyReply.create({
                                UserID : req.body.userID,
                                ReplyID : req.body.replyID,
                                Contents : req.body.contents
                        }).then(async result => {
                                console.log(URL + '/Insert/ReplyReply CommunityPostReplyReply create Success');

                                await models.CommunityReplySubscriber.findAll({
                                        where : {
                                          ReplyID : body.replyID
                                        }
                                }).then(async subResult => {
                                        console.log(URL + 'CommunityReplySubscriber findAll Success');

                                        for(var i = 0 ; i < subResult.length; ++i){
                                          if(subResult[i].UserID == req.body.userID) continue;

                                          var tempData = subResult[i];

                                          client.hgetall(String(subResult[i].UserID), async function(err, obj) {
                                                if(err) throw err;
                                                if(obj == null) return;
                                        
                                                var user = await models.User.findOne({where: {UserID: req.body.userID}});
                                        
                                                  var data = JSON.stringify({
                                                    userID : req.body.userID,
                                                    inviteID : tempData.UserID,
                                                    title : "대댓글",
                                                    type : "POST_REPLY_REPLY",
                                                    tableIndex : reply.PostID,
                                                    body : user.NickName + "님이 대댓글을 달았습니다.",
                                                    isSend : obj.isOnline,
                                                })
                                        
                                                if(fcmFuncRouter.SendFcmEvent( data )){
                                                  console.log(URL + 'InsertReply fcm is true');
                                                  return;
                                                }else{
                                                  console.log(URL + 'InsertReply fcm is false');
                                                  return;
                                                }
                                              });
                                        }

                                        res.status(200).send(result);
                                }).catch(err => {
                                        console.log(URL + 'Insert/ReplyReply CommunityReplySubscriber findAll Failed' +  err);
                                        res.status(400).send(null);
                                })
                        }).catch(err => {
                                console.log(URL + '/Insert/ReplyReply CommunityPostReplyReply create Failed' + err);
                                res.status(404).send(null);
                        })
                }
        }
})

router.post('/InsertLike', async(req, res) => {
        globalRouter.CreateOrDestroy(models.CommunityPostLike,
          {
                  UserID : req.body.userID,
                  PostID : req.body.postID,
          }, 
        ).then(async function(result) {

                var post = await models.CommunityPost.findOne({where : {id : req.body.postID}});

                if(globalRouter.IsEmpty(post)){
                        res.status(200).send(null);
                        return;
                }else{
                        var likes = await models.CommunityPostLike.findAll({where : {PostID : post.id}});
                        var likesLength = likes.length;
                        var declares = await models.CommunityPostDeclare.findAll({where : {TargetID : post.id}});
                        var declareLength = declares.length;

                        if(result['created'] == true){
                                //인기 기준이 되면
                                if((likesLength - declareLength) >= POPULAR_BASE){
                                        //인기 게시글이 아니면
                                        if(post.Type != 1){
                                                post.update(
                                                        {
                                                                Type : 1,
                                                                Point : likesLength - declareLength,
                                                                RegisterTime : Date.now()
                                                        }
                                                ).then(result => {
                                                        console.log(URL + 'popular point is update success');
                                                }).catch(err => {
                                                        console.log(URL + 'popular point is update failed' + err);
                                                })
                                        //있으면 점수 update
                                        }else if(post.Type == 2){
                                                popular.update({Point : likesLength - declareLength}).then(result => {
                                                        console.log(URL + 'popular point is update success');
                                                }).catch(err => {
                                                        console.log(URL + 'popular point is update failed' + err);
                                                })
                                        }
                                }

                                //자기자신이면 건너뜀
                                if(post.UserID == req.body.userID){
                                        res.status(200).send(result);
                                        return;
                                }
                        
                                client.hgetall(String(post.UserID), async function(err, obj) {
                                        if(err) throw err;
                                        if(obj == null) return;
                                
                                        var user = await models.User.findOne({where: {UserID: req.body.userID}});
                                        
                                        var data = JSON.stringify({
                                                userID : req.body.userID,
                                                targetID : post.UserID,
                                                title : "게시글",
                                                type : "POST_LIKE",
                                                tableIndex : req.body.postID,
                                                body : user.NickName + " 님이 좋아요 를 눌렀습니다.",
                                                isSend : obj.isOnline
                                        })  
                                        
                                        if(fcmFuncRouter.SendFcmEvent( data )){
                                                console.log(URL + 'InsertLike fcm is true');
                                                res.status(200).send(result);
                                                return;
                                        }else{
                                                console.log(URL + 'InsertLike fcm is false');
                                                res.status(400).send(result);
                                                return;
                                        }
                                });
                        }else{
                                //좋아요가 감소 되었을 경우
                                if(post.Type == 1){
                                        //기준미달이면 일반게시물로 변환
                                        if((likesLength - declareLength) < POPULAR_BASE){
                                                post.update(
                                                        {
                                                                Type : 0,
                                                                Point : 0,
                                                                RegisterTime : null
                                                        }
                                                ).then(result => {
                                                        console.log(URL + 'popular point is update success');
                                                }).catch(err => {
                                                        console.log(URL + 'popular point is update failed' + err);
                                                })
                                        }
                                }

                                res.status(200).send(result);
                        }
                }
        }).catch(function (err){
          globalRouter.logger.error(URL + "InsertLike Faield" + err);
          res.status(400).send(null);
        })
      });

router.post('/Filter', async function(req, res){
	let category = req.body.category;
        let kind = req.body.kind;
        let location = req.body.location;
        let categoryCheckAll = req.body.categoryCheckAll;
        let locationCheckAll = req.body.locationCheckAll;
        let Type = req.body.type;
        
        var order = (Type == 0 || Type == 1) ? 'createdAt' : 'RegisterTime';
        var rule = {};

        let kindList = globalRouter.getWords(kind);

        for(var i = 0 ; i < kindList.length ; ++i){
                kindList[i] = kindList[i].replace(' ', '')
        }

        //전체가 아니고, 강아지, 고양이를 누르지 않았으면
        if(kindList[0] != '-1' ){
                let filterData = [];
                var index = 0;
                //1 = 강아지, 2 = 고양이
                if(kindList[0] == '1' || kindList[0] == '2'){
                        index = 1; 
                        filterData.push({PetType : {[Op.like] : '%' + kindList[0] + '%'}})

                        if(kindList[1] == '2'){
                                index = 2; 
                                filterData.push({PetType : {[Op.like] : '%' + kindList[1] + '%'}})
                        }
                }

                for(var i = 0 ; i < kindList.length ; ++i){
                        filterData.push({Kind : {[Op.like] : '%' + kindList[i] + '%'}})
                }

                rule = {
                        [Op.or] : filterData,
                }
        }

        if(categoryCheckAll == 0){
                rule.Category = {
                        [Op.regexp] : '^' + category
                }
        }

        if(locationCheckAll == 0) {
                rule.Location = {
                        [Op.regexp] : '^' + location
                }
        }

        if(Type == 1) {
                rule.Type = 1;
        }

        rule.IsShow = 1
        console.log(rule);

        await models.CommunityPost.findAll({
                limit : 30,
                offset : req.body.index * 1,
                order: [[order, 'DESC']],
                where : rule,
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
        }).then(async result => {
                console.log(URL + 'Filter/Community Success');

                let resData = [];

                for(var i = 0 ; i < result.length; ++i){
                        var declares = await models.CommunityPostDeclare.findAll({where : {TargetID : result[i].id}});
                        var declareLength = declares.length;
                        var community = result[i];

                        var user = await models.User.findOne(
                                {
                                        attributes: [ 
                                                "UserID", "NickName", "ProfileURL"
                                        ],
                                        where : {UserID : result[i].UserID}
                                }
                        );

                        var userID = user.UserID;
                        var nickName = user.NickName;
                        var profileURL = user.ProfileURL;
                        
                        var temp = {
                                userID,
                                nickName,
                                profileURL,
                                community,
                                declareLength
                        }

                        resData.push(temp);
                }

                if(globalRouter.IsEmpty(resData))
                        resData = null;

                res.status(200).send(resData);
        }).catch(err => {
                globalRouter.logger.error(URL + 'Filter/Community Failed ' + err);
                res.status(400).send(null);
        });
})

router.post('/Delete', async(req, res) => {
        await models.CommunityPost.update(
                {
                        IsShow : 0
                },
                {
                        where : { id : req.body.id }
                }
        ).then(result => {
                console.log(URL + '/Delete update is success');
                res.status(200).send(true);
        }).catch(err => {
                globalRouter.logger.error(URL + 'Delete update is Failed ' + err);
                res.status(400).send(null);
        });
})

module.exports = router;