const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        moment = require('moment'),
        fcmFuncRouter = require('../fcm/fcmFuncRouter'),
        globalRouter = require('../global');

const s3Multer = require('../multer');

const communityPostFuncRouter = require('./communityPostFuncRouter');
const verify = require('../../controllers/parameterToken');
const client = globalRouter.client;
const { Op } = require('sequelize');

let URL = '/CommunityPost';
const LIKES_LIMIT = 100;
const POPULAR_BASE = 5;//인기글 최소 기준

const { promisify } = require("util");
const getallAsync = promisify(client.hgetall).bind(client);

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
                        Type : 1,
                        IsShow : 1
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

                if(globalRouter.IsEmpty(result) || result.IsShow == 0){
                        globalRouter.logger.error('empty or delete post');
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
                                                                model : models.CommunityPostReplyReplyDeclare,
                                                                required : true,
                                                                limit : LIKES_LIMIT
                                                        }
                                                ]
                                        }
                                ]
                        }).then(result => {
                                res.status(200).send(result);
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Select/Detail CommunityPostReply findAll Failed ' + err );
                                res.status(400).send(null);
                        })
                }
        }).catch(err => {
                globalRouter.logger.error(URL + '/Select/Detail CommunityPost findOne Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/InsertOrModify', async(req, res) => {
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
                console.log(field + ' ' + value);
                fields.set(field, value);
                if(field == 'removeindexlist') remove_index_values.push(value);
                else if(field == 'imageurllist') image_url_values.push(value);
        });
          
        form.on('file', function (field, file) {
                if(field == 'images') files.push(file);
                else console.log('this file has no fieldname');
        }).on('end', async function() {

                if(await verify.verifyToken(fields.get('accessToken')) == false){
                        if(fields.get('isCreate') == 1){
                                res.status(404).send(null);
                        }else{
                                res.status(200).send(await communityPostFuncRouter.SelectByID(fields.get('id')));
                        }
                        
                }else{
                        if(fields.get('isCreate') == 1) {
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

                                        await models.CommunityPostSubscriber.create({
                                                PostID : result.id,
                                                UserID : fields.get('userID')
                                        }).catch(err => {
                                                globalRouter.logger.error(URL + '/InsertOrModify CommunityPostSubscriber create Failed ' + err);
                                        })

                                        //접속중인 사용자들에게 새 글 작성 알림
                                        await models.User.findAll({
                                                where : {
                                                        //[Op.not] : { UserID : req.body.userID},
                                                        updatedAt : { 
                                                                //1시간 이내
                                                                [Op.gte] : moment().subtract(1, 'H').toDate()
                                                        },
                                                }
                                        }).then(async userResult => {

                                                for(var i = 0 ; i < userResult.length ; ++i){
                                                        var getAllRes = await getallAsync(String(userResult[i].UserID));

                                                        if(getAllRes == null) continue;

                                                        if(userResult[i].UserID == 136 || userResult[i].UserID == 1){
                                                                var data = JSON.stringify({
                                                                        userID : fields.get('userID'),
                                                                        targetID : userResult[i].UserID,
                                                                        title : "새로운 댓글",
                                                                        type : "POST_NEW_UPDATE",
                                                                        tableIndex : result.id,
                                                                        body : "새 글이 작성되었습니다.",
                                                                        isSend : getAllRes.isOnline,
                                                                })
        
                                                                if(fcmFuncRouter.SendFcmEvent(data)){
                                                                        console.log(URL + '/InsertOrModify POST_NEW_UPDATE fcm is true');
                                                                }else{
                                                                        console.log(URL + '/InsertOrModify POST_NEW_UPDATE fcm is false');
                                                                }
                                                        }
                                                        
                                                }
                                        })

                                        res.status(200).send(await communityPostFuncRouter.SelectByID(result.id));
                                }).catch(err => {
                                        globalRouter.logger.error(URL + '/InsertOrModify CommunityPost create Failed ' + err);
                                        res.status(400).send(null);
                                })
                        }else {
        
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
                        id : req.body.postID,
                        IsShow : 1
                }
        })

        if(globalRouter.IsEmpty(communityPost)){
                res.status(404).send(null);
                return;
        }else{
                await models.CommunityPostReply.create({
                        UserID : req.body.userID,
                        PostID : req.body.postID,
                        Contents : req.body.contents
                }).then( async result => {

                        //FCM
                        await models.CommunityPostSubscriber.findAll({
                                where : {
                                        PostID : req.body.postID
                                }
                        }).then(async subResult => {

                                var user = await models.User.findOne({where: {userID : req.body.userID}});

                                for(var i = 0 ; i < subResult.length; ++i){
                                        if(subResult[i].UserID == req.body.userID) continue;

                                         var getAllRes = await getallAsync(String(subResult[i].UserID));

                                         if(getAllRes == null) continue;

                                         var data = JSON.stringify({
                                                 userID : req.body.userID,
                                                 targetID : subResult[i].UserID,
                                                 title : "새로운 댓글",
                                                 type : "POST_REPLY",
                                                 tableIndex : req.body.postID,
                                                 body : user.NickName + "님이 댓글을 달았습니다.",
                                                 isSend : getAllRes.isOnline,
                                         })

                                        if(fcmFuncRouter.SendFcmEvent(data)){
                                                console.log(URL + '/Insert/Reply fcm is true');
                                        }else{
                                                console.log(URL + '/Insert/Reply fcm is false');
                                        }
                                }
                        })

                        res.status(200).send(result);
                }).catch(err => {
                        console.log(URL + '/Insert/Reply CommunitySubscriber findAll Failed' + err);
                        res.status(404).send(null);
                })
        }
})

router.post('/Insert/ReplyReply', require('../../controllers/verifyToken'), async(req, res) => {
        let reply = await models.CommunityPostReply.findOne({
                where : {
                        id : req.body.replyID,
                        IsShow : 1
                }
        })

        if(globalRouter.IsEmpty(reply)){
                res.status(404).send(null);
        }else{
                let replyPost = await models.CommunityPost.findOne({
                        where : {
                                id : reply.PostID,
                                IsShow : 1
                        }
                })

                if(globalRouter.IsEmpty(replyPost)){
                        res.status(404).send(null);
                }else{
                        var user = await models.User.findOne({where: {UserID: req.body.userID}});

                        //글 작성자와 댓글 작성자가 다르면
                        if(req.body.userID != replyPost.UserID){
                                var getAllResOne = await getallAsync(String(replyPost.UserID));

                                if(getAllResOne != null) {
                                        var data = JSON.stringify({
                                                userID : req.body.userID,
                                                targetID : replyPost.UserID,
                                                title : "대댓글",
                                                type : "POST_REPLY_REPLY",
                                                tableIndex : reply.PostID,
                                                body : user.NickName + "님이 대댓글을 달았습니다.",
                                                isSend : getAllResOne.isOnline,
                                        })
                
                                        //글 작성자 한테 fcm
                                        if(fcmFuncRouter.SendFcmEvent( data )){
                                        }else{
                                                globalRouter.logger.error(URL + '/Insert/ReplyReply CommunityPostReplyReply create Failed' + err);
                                        }
                                }
                        }

                        await models.CommunityPostReplyReply.create({
                                UserID : req.body.userID,
                                ReplyID : req.body.replyID,
                                Contents : req.body.contents
                        }).then(async result => {
                                if(req.body.userID != reply.UserID){
                                        var getAllResTwo = await getallAsync(String(reply.UserID));

                                        if(getAllResTwo == null) {
                                                var data = JSON.stringify({
                                                        userID : req.body.userID,
                                                        targetID : reply.UserID,
                                                        title : "대댓글",
                                                        type : "POST_REPLY_REPLY",
                                                        tableIndex : reply.PostID,
                                                        body : user.NickName + "님이 대댓글을 달았습니다.",
                                                        isSend : getAllResTwo.isOnline,
                                                })
                
                                                //댓글 작성자한테 fcm
                                                if(fcmFuncRouter.SendFcmEvent( data )){
                                                }else{
                                                        globalRouter.logger.error(URL + '/Insert/ReplyReply CommunityPostReplyReply create Failed' + err);
                                                }
                                                
                                        }
                                }

                                res.status(200).send(result);
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Insert/ReplyReply CommunityPostReplyReply create Failed' + err);
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

                var post = await models.CommunityPost.findOne({where : {
                        id : req.body.postID,
                        IsShow : 1
                }});

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
                                                }).catch(err => {
                                                        console.log(URL + 'popular point is update failed' + err);
                                                })
                                        //있으면 점수 update
                                        }else if(post.Type == 2){
                                                popular.update({Point : likesLength - declareLength}).then(result => {
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

                                var getAllRes = await getallAsync(String(post.UserID));

                                if(getAllRes == null) {
                                        res.status(200).send(result);
                                        return;
                                }else {
                                        var user = await models.User.findOne({where: {UserID: req.body.userID}});
                                        
                                        var data = JSON.stringify({
                                                userID : req.body.userID,
                                                targetID : post.UserID,
                                                title : "게시글",
                                                type : "POST_LIKE",
                                                tableIndex : req.body.postID,
                                                body : user.NickName + "님이 좋아요 를 눌렀습니다.",
                                                isSend : getAllRes.isOnline
                                        })  

                                        if(fcmFuncRouter.SendFcmEvent( data )){
                                                res.status(200).send(result);
                                                return;
                                        }else{
                                                res.status(400).send(result);
                                                return;
                                        }
                                }
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
                globalRouter.logger.error(URL + '/FilterFailed ' + err);
                res.status(400).send(null);
        });
})

router.post('/Search', async(req, res) => {
        await models.CommunityPost.findAll({
                where : {
                        [Op.or] : {
                                Title : {[Op.like] : '%' + req.body.keywords + '%'},
                                Contents : {[Op.like] : '%' + req.body.keywords + '%'},
                        },
                        IsShow : 1
                },
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
                order: [['id', 'DESC']],
        }).then(async result => {

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
                globalRouter.logger.error(URL + '/Search CommunityPostReply findAll Failed' + err);
                res.status(400).send(null);
        })
});

router.post('/Delete', require('../../controllers/verifyToken'), async(req, res) => {
        switch(req.body.postType){
                case 0 :
                {
                        await models.CommunityPost.update(
                                {
                                        IsShow : 0
                                },
                                {
                                        where : { id : req.body.id }
                                }
                        ).then(result => {
                                res.status(200).send(true);
                        }).catch(err => {
                                globalRouter.logger.error(URL + 'Delete update is Failed ' + err);
                                res.status(400).send(null);
                        });
                }
                break;
                case 1 :
                {
                        await models.CommunityPostReply.update(
                                {
                                        IsShow : 0
                                },
                                {
                                        where : { id : req.body.id }
                                }
                        ).then(result => {
                                res.status(200).send(true);
                        }).catch(err => {
                                globalRouter.logger.error(URL + 'Delete update is Failed ' + err);
                                res.status(400).send(null);
                        });
                }
                break;
                case 2 : 
                {
                        await models.CommunityPostReplyReply.update(
                                {
                                        IsShow : 0
                                },
                                {
                                        where : { id : req.body.id }
                                }
                        ).then(result => {
                                res.status(200).send(true);
                        }).catch(err => {
                                globalRouter.logger.error(URL + 'Delete update is Failed ' + err);
                                res.status(400).send(null);
                        });
                }
                break;
        }
})

router.post('/Declare', require('../../controllers/verifyToken'), async (req, res) => {
        switch(req.body.postType){
          case 0:
            {
              await models.CommunityPostDeclare.findOrCreate({
                where: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                },
                defaults: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                  Contents : req.body.contents,
                  Type : req.body.type
                }
              }).then( result => {
                res.status(200).send(result);
              }).catch( err => {
                globalRouter.logger.error(URL + "/Declare findOrCreate Faield" + err);
                res.status(400).send(null);
              })
            }
            break;
          case 1:
            {
              await models.CommunityPostReplyDeclare.findOrCreate({
                where: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                },
                defaults: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                  Contents : req.body.contents,
                  Type : req.body.type
                }
              }).then( result => {
                res.status(200).send(result);
              }).catch( err => {
                globalRouter.logger.error(URL + "/Declare CommunityReplyDeclare findOrCreate Faield" + err);
                res.status(400).send(null);
              })
            }
            break;
          case 2:
            {
              await models.CommunityPostReplyReplyDeclare.findOrCreate({
                where: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                },
                defaults: {
                  UserID : req.body.userID,
                  TargetID : req.body.targetID,
                  Contents : req.body.contents,
                  Type : req.body.type
                }
              }).then( result => {
                res.status(200).send(result);
              }).catch( err => {
                globalRouter.logger.error(URL + "/Declare CommunityReplyReplyDeclare findOrCreate Faield" + err);
                res.status(400).send(null);
              })
            }
            break;
        }
      });

router.post('/Select/ByUserID', async(req, res) => {
        await models.CommunityPost.findAll({
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
                        UserID : req.body.userID
                }
        }).then(async result => {
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
                globalRouter.logger.error(URL + '/Select/ByUserID CommunityPostReply findAll Failed' + err);
                res.status(400).send(null);
        })
})

router.post('/Select/ReplyByUserID', async(req, res) => {
        let reply = await models.CommunityPostReply.findAll({
                attributes: [
                        [models.sequelize.fn('DISTINCT', models.sequelize.col('PostID')) ,'PostID'],
                ],
                where: {
                        IsShow : 1,
                        UserID : req.body.userID
                },
                order : [
			['id', 'DESC']
                ],
        })

        //비어있으면
        if(globalRouter.IsEmpty(reply)){
                res.status(200).send(false);
        }else{
                let resData = [];
                for(var i = 0 ; i < reply.length; ++i){
                        await models.CommunityPost.findOne({
                                where : {
                                        id : reply[i].PostID
                                },
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
                                if(result.IsShow == 1){
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
                
                                        var temp = {
                                                userID,
                                                nickName,
                                                profileURL,
                                                community,
                                                declareLength
                                        }

        
                                        if(globalRouter.IsEmpty(temp) == false)
                                                resData.push(temp);
                                }
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Select/ByUserID CommunityPostReply findAll Failed' + err);
                        })
                }

                if(globalRouter.IsEmpty(resData)){
                        res.status(200).send(null);
                }else{
                        res.status(200).send(resData);
                }
        }
})

router.post('/Select/LikeByUserID', async(req, res) => {
        let like = await models.CommunityPostLike.findAll({
                where: {
                        UserID : req.body.userID
                },
                order : [
			['id', 'DESC']
                ],
        })

        //비어있으면
        if(globalRouter.IsEmpty(like)){
                res.status(200).send(null);
        }else{
                let resData = [];
                for(var i = 0 ; i < like.length; ++i){
                        await models.CommunityPost.findOne({
                                where : {
                                        id : like[i].PostID
                                },
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
                                if(result.IsShow == 1){
                                        var index = resData.findIndex(function(item, index, arr){
                                                return item['community'].id == result.id 
                                        });
        
                                        if(index == -1){
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
                        
                                                var temp = {
                                                        userID,
                                                        nickName,
                                                        profileURL,
                                                        community,
                                                        declareLength
                                                }
                        
                                
                                                if(globalRouter.IsEmpty(temp) == false)
                                                        resData.push(temp);
                                                
                                        }
                                }
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/Select/ByUserID CommunityPostReply findAll Failed' + err);
                        })
                }

                if(globalRouter.IsEmpty(resData)){
                        res.status(200).send(null);
                }else{
                        res.status(200).send(resData);
                }
        }
})

router.post('/Select/Subscribe', async(req, res) => {
        await models.CommunityPostSubscriber.findOne({
          where : {
            PostID : req.body.postID,
            UserID : req.body.userID,
          }
        }).then( result => {
          res.status(200).send(result);
        }).catch( err => {
          globalRouter.logger.error(URL + "/Select/Subscribe CommunitySubscriber findOne Faield" + err);
          res.status(400).send(null);
        })
      })

//게시글 알림
router.post('/Update/Subscribe', async(req, res)=>{
        globalRouter.CreateOrDestroy(models.CommunityPostSubscriber,
                {
                PostID : req.body.postID,
                UserID : req.body.userID,
                }
        ).then( result => {
                res.status(200).send(result);
        }).catch( err => {
                globalRouter.logger.error(URL + "/Update/Subscribe CommunitySubscriber findOrCreate Faield" + err);
                res.status(400).send(null);
        })
})

module.exports = router;