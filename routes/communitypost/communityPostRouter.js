const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        globalRouter = require('../global');

const s3Multer = require('../multer');
const communityPostFuncRouter = require('./communityPostFuncRouter');
const client = globalRouter.client;

let URL = '/CommunityPost';

router.post('/Select/ID', async(req, res) => {
        res.status(200).send(await communityPostFuncRouter.SelectByID(req.body.id));
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
                                Contents : fields.get('contents')
                        }).then(async result => {
                                console.log(URL + '/InsertOrModify create Success');

                                for(var i = 0 ; i < files.length ; ++i){

                                        var fileName = Date.now() + '.' + files[i].name.split('.').pop();

                                        s3Multer.formidableFileUpload(files[index], 'CommunityPhotos/' + result.id + '/' + fileName);
                                        if(i == 0){
                                                await result.update({ImageURL1 : fileName})
                                        }else if(i == 1){
                                                await result.update({ImageURL2 : fileName})
                                        }else{
                                                await result.update({ImageURL3 : fileName})
                                        }
                                }
                        }).catch(err => {
                                globalRouter.logger.error(URL + '/InsertOrModify CommunityPost create Failed ' + err);
                                res.status(400).send(null);
                        })
                }else {
                        console.log(URL + '/InsertOrModify CommunityPost Update Flow');

                        var community = await communityPostFuncRouter.SelectByID(fileds.get('id'));

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

                                //기존 이미지 삭제
                                for(var i = 0 ; i < remove_index_values.length ; ++i){
                                        var imageURL = community.ImageURL1;

                                        if(remove_index_values[i] == 2) imageURL = community.ImageURL2;
                                        else if(remove_index_values[i] == 3) imageURL = community.ImageURL3;

                                        s3Multer.fileDelete('CommunityPhotos/' + fields.get('id'), imageURL);

                                        if(remove_index_values[i] == 1) {
                                                await community.update({ImageURL1 : ''});
                                        }else if(remove_index_values[2] == 2){
                                                await community.update({ImageURL2 : ''});
                                        }else{
                                                await community.update({ImageURL3 : ''});
                                        }
                                }

                                //기존 이미지 순서 변경
                                for(var i = 0 ; i < image_url_values.length; ++i){
                                        if(i == 0){
                                                //기존 이미지와 다를 때만 적용
                                                if(image_url_values[i] != community.ImageURL1){
                                                        await community.update({ImageURL1 : image_url_values[i]})
                                                }
                                        }else if(i == 1){
                                                if(image_url_values[i] != community.ImageURL2){
                                                        await community.update({ImageURL2 : image_url_values[i]})
                                                }
                                        }else{
                                                if(image_url_values[i] != community.ImageURL3){
                                                        await community.update({ImageURL3 : image_url_values[i]})
                                                }
                                        }
                                }

                                //새로운 데이터 생성
                                for(var i = image_url_values.length ; i < image_url_values.length + files.length ; ++i){
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

module.exports = router;