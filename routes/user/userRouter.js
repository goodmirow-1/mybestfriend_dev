const router = require('express').Router(),
        models = require('../../models'),
        formidable = require('formidable'),
        globalRouter = require('../global');

const config = require('../../config/configure'); //for secret data
const crypto = require('crypto');
const tokenController = require('../../controllers/tokenInfo');
const passwordController = require('../../controllers/encryptpwd');
const moment = require('moment');

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const s3Multer = require('../multer');
const userFuncRouter = require('./userFuncRouter');

const client = globalRouter.client;

const ACCESS_TOKEN = 0;
const REFRESH_TOKEN = 1;

let URL = '/User';

router.post('/Select', async (req, res) => {
    await models.User.findOne({
        where : {
            UserID : req.body.userID
        },
        include : [
            {
                model : models.Pet,
                required : true,
                limit : 10,
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
                    }
                ]
            }
        ]
    }).then(result => {
        console.log(URL + '/Select/User User findOne Success');
        res.status(200).send(result);
    }).catch(err => {
        globalRouter.logger.error(URL + '/Select/User findOne is Failed' + err);
        res.status(400).send(null);
    })
})

router.post('/IDCheck', async (req, res) => {
    if (globalRouter.IsEmpty(req.body.email)) {
        console.log('empty id or pwd error');
        res.status(400).send(null);
        return;
    }

    await models.User.findOne({
        where : {
            Email : req.body.email
        }
    }).then(result => {
        console.log(URL + '/IDCheck User findOne is Success');

        if(globalRouter.IsEmpty(result)){
            console.log('IDCheck is empty');
            res.json(null);
        }else{
            res.status(200).send(result);
        }
    }).catch(err => {
        globalRouter.logger.error(URL + '/IDCheck User findOne is Failed' + err);
        res.status(400).send(null);
    })
});

router.post('/PhoneCheck', async(req, res) => {
    if (globalRouter.IsEmpty(req.body.name)) {
        console.log('empty name error');
        res.status(400).send(null);
        return;
    }

    await models.User.findOne({
        where : {
            RealName : req.body.name,
            PhoneNumber : req.body.phoneNumber
        }
    }).then(result => {
        console.log(URL + '/PhoneCheck findOne success');
        res.status(200).send(result);
    }).catch(err => {
        globalRouter.logger.error(URL + '/PhoneCheck findOne is Failed' + err);
        res.status(400).send(null);
    })
})

router.post('/Find/ID', async(req, res) => {
    await models.User.findOne({
        where : {
            RealName : req.body.name,
            PhoneNumber : req.body.phoneNumber
        }
    }).then(result => {
        console.log(URL + '/Find/ID findOne success');
        res.status(200).send(result);
    }).catch(err => {
        globalRouter.logger.error(URL + '/Find/ID findOne is Failed' + err);
        res.status(400).send(null);
    })
})

router.post('/Find/Password', async(req, res) => {
    await models.User.findOne({
        where : {
            Email : req.body.email,
            RealName : req.body.name,
            PhoneNumber : req.body.phoneNumber
        }
    }).then(result => {
        console.log(URL + "/Find/Password User findOne success");
        res.status(200).send(result);
    }).catch(err => {
        console.log(URL + "/Find/Password User findOne Failed" + err);
        res.status(404).send(null);
    })
})

router.post('/Modify/PasswordDontKnowID', async(req, res) => {
    await models.User.findOne({
        where: {
          Email: req.body.email, //좌측에 있는 부분이 ..models/user.js 에 있는 변수명과 (테이블의 변수명과) 일치해야하는 부분이다.
        },
      }).then(async result => {
    
        if(globalRouter.IsEmpty(result)){
          console.log(result);
          globalRouter.logger.error(URL + 'Modify/PasswordDontKnowID is Empty');
          res.json(null);
        }else{
          const newhashedPwd = passwordController.getHashedPassword(req.body.password);
    
          let value = {
            Password : newhashedPwd,
          }
    
          await result.update(value).then(result => {
            console.log(URL + 'Modify/PasswordDontKnowID Success' + result);
            res.json(true);
          }).catch(err => {
            console.log(URL + 'Modify/PasswordDontKnowID Failed' + err);
            res.json(null);
          })
        }
      }).catch(err => {
        globalRouter.logger.error(URL + 'Modify/PasswordDontKnowID is Failed' + err);
        res.json(null);
      })
})

router.post('/Insert', async(req,res) => {
    if(globalRouter.IsEmpty(req.body.email) || globalRouter.IsEmpty(req.body.password)){
        console.log('empty id or pwd error');
        res.status(400).send(null);
    }else{
        const hashedPwd = crypto.createHmac('sha256', config.pwdsecret).update(req.body.password).digest('base64');
        const marketingAgreeTime = req.body.marketingAgree == 1 ? moment().format('YYYY-MM-DD HH:mm:ss') : null;

        await models.User.findOrCreate({
            where: {
                Email : req.body.email
            },
            defaults: {
                Email : req.body.email,
                RealName: req.body.name,
                Password: hashedPwd,
                PhoneNumber : req.body.phoneNumber,
                Sex : req.body.sex,
                Birthday : req.body.birthday,
                MarketingAgree: req.body.marketingAgree,
                MarketingAgreeTime: marketingAgreeTime
            }
        }).then(async function  (result) {
            if (result[1]) { 
                console.log('user register success');
        
                client.hmset(String(result[0].UserID), {
                    "isOnline" : 0,
                });

                res.status(200).send(result[0]);
            } else { //만약 이미 있는 회원 아이디이면 result[1] == false 임
                console.log('already member');
                res.status(400).send(false);
            }
        }).catch(err => {
            console.log('user register failed' + err);
            res.status(400).send(false);
        });
    }
})

router.post('/Insert/NeedInfo', async(req, res) => {
    await models.User.update(
        {
            NickName : req.body.nickname,
            Location : req.body.location,
            Sex: req.body.sex,
            Birthday: req.body.birthday
        },
        {
            where : {
                UserID : req.body.userID
            }
        }
    ).then(result => {
        console.log(URL + '/Insert/NeedInfo Success');
        res.status(200).send(result);
    }).catch(err => {
        globalRouter.logger.error(URL + '/Insert/NeedInfo User findOne is Failed' + err);
        res.status(400).send(null);
    })
})

router.post('/DebugLogin', async(req, res) => {
    await models.User.findOne({
        where : {
            Email : req.body.email
        },
        include : [
            {
                    model : models.Pet,
                    required : true,
                    limit: 99,
                    order : [
                                    ['id', 'DESC']
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
                                ]
                        },
		            ]
            }
        ]
    }).then(result => {
        console.log(URL + '/DebugLogin User findOne is Success');
            //로그인 정보가 없을 때
        if(globalRouter.IsEmpty(result)){
            res.status(200).send(null);
            return;
        }else{
            const payload = {
                Email : req.body.email
            };

            const secret = tokenController.getSecret(ACCESS_TOKEN);
            const refsecret = tokenController.getSecret(REFRESH_TOKEN);
        
            const token = tokenController.getToken(payload, secret, ACCESS_TOKEN);
            const reftoken = tokenController.getToken(payload, refsecret, REFRESH_TOKEN);
            console.log("refreshtoken:" + reftoken);

            let value = {
                RefreshToken: reftoken 
              }
          
            var resData = {
                result,
                AccessToken: token,
                RefreshToken: reftoken,
                AccessTokenExpiredAt: (tokenController.getExpired(token) - 65000).toString(),
            };

            result.update(value).then(result2 => {
                res.status(200).send(resData);
            }).catch(err => {
                console.log(URL + '/DebugLogin User Update is failed' + err);
                res.status(400).send(null);
            })
        }
    }).catch(err => {
        globalRouter.logger.error(URL + '/DebugLogin User findOne is Failed' + err);
        res.status(400).send(null);
    })
})

router.post('/Login', async(req,res) => {
    const hashedPwd = crypto.createHmac('sha256', config.pwdsecret).update(req.body.password).digest('base64');

    await models.User.findOne({
        where: {
            Email : req.body.email, //좌측에 있는 부분이 ..models/user.js 에 있는 변수명과 (테이블의 변수명과) 일치해야하는 부분이다.
            Password : hashedPwd //우측에 있는 부분이 client 에서 전송되는 데이터 명으로, client 에서 보내는 변수명과 일치해야한다 
        },
        include : [
            {
                    model : models.Pet,
                    required : true,
                    order : [
                                    ['id', 'DESC']
                    ],
                    limit: 99,
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
                                ]
                        },
		            ]
            }
        ]
    }).then(result => {
        if(globalRouter.IsEmpty(result)){
            console.log(URL +'/Login is Empty');
            res.status(200).send(null);
        }else{

            client.hgetall(String(result.UserID), function(err, obj) {
                if(err) throw err;
                if(obj == null) return;

                console.log("input password:" + result.Password);
                const resPassword = result.Password;
    
                if (resPassword == hashedPwd) { //들어온 비밀번호의 hased 버전이 테이블에 있는 비밀번호 값과 같으면 그다음 flow 로 넘어갈 수 있음
                    const payload = {
                        Email : req.body.email
                    };
                    const secret = tokenController.getSecret(ACCESS_TOKEN);
                    const refsecret = tokenController.getSecret(REFRESH_TOKEN);
    
                    const token = tokenController.getToken(payload, secret, ACCESS_TOKEN);
                    const reftoken = tokenController.getToken(payload, refsecret, REFRESH_TOKEN);
                    console.log("refreshtoken:" + reftoken);
    
                    const response = {
                        result,
                        AccessToken: token,
                        RefreshToken: reftoken,
                        AccessTokenExpiredAt: (tokenController.getExpired(token) - 65000).toString(),
                    }
    
                    console.log("WHAT  IS  RESULT.UserID   :",result.UserID)
    
                    models.User.update( //reftoken 값 update
                    { RefreshToken: reftoken }
                    , { where: { UserID: result.UserID } }
                    ).then(result2 => {
                        console.log('RefreshToken Update Success' + result2 );

                        client.hmset(String(userID), {
                            "isOnline" : 1,
                        });

                        res.status(200).json(response);
                    }).catch(err => {
                        console.log(err + "real error");
                        res.status(400).send(null);
                    })
                }else{
                    res.status(400).send(null);
                }
            });
        }
    })
})

router.post('/Login/Social', async(req, res) => {
    if(globalRouter.IsEmpty(req.body.email)){
        console.log(URL + '/Login/Social id is empty');
        res.status(400).json(null);
    }else{
        await models.User.findOrCreate({
            where : {
                Email : req.body.email
            },
            defaults : {
                Email : req.body.email,
                Name : req.body.name,
                LoginType : req.body.loginType
            },
            include : [
                {
                        model : models.Pet,
                        required : true,
                        					limit: 99,
                        order : [
                                        ['id', 'DESC']
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
                                    ]
                            },
                        ]
                }
            ]
        }).then(result => {
            if(result[1]){ //새 회원이면
                //필요에 따라 처리 필요함 (구글, 카톡, 애플)
                client.hmset(String(result[0].UserID), {
                    "isOnline" : 0,
                });
            }else{
                client.hgetall(String(result.UserID), function(err, obj) {
                    if(err) throw err;
                    if(obj == null) return;

                    const payload = {
                        Email : req.body.email
                    };
            
                    const secret = tokenController.getSecret(ACCESS_TOKEN);
                    const refsecret = tokenController.getSecret(REFRESH_TOKEN);
        
                    const token = tokenController.getToken(payload, secret, ACCESS_TOKEN);
                    const reftoken = tokenController.getToken(payload, refsecret, REFRESH_TOKEN);
                    console.log("refreshtoken:" + reftoken);
                    
                    const response = {
                        result: result[0],
                        AccessToken: token,
                        RefreshToken: reftoken,
                        AccessTokenExpiredAt: (tokenController.getExpired(token) - 65000).toString()
                    }
        
                    models.User.update( //reftoken 값 update
                    { RefreshToken: reftoken }
                    , { where: { UserID: result[0].UserID } }
                    ).then(result => {
                    console.log('RefreshToken Update Success' + result);

                    client.hmset(String(userID), {
                        "isOnline" : 1,
                    });            

                    res.status(200).json(response);
                    }).catch(err => {
                    console.log(err + "real error");
                    res.status(400).send(null);
                    })
                });

            }
        })
    }
})


router.post('/Logout', async(req, res) => {
    await models.FcmTokenList.destroy({
        where : {
            UserID : req.body.userID
        },
    }).then( async result => {
        console.log(URL + '/Logout success');

        client.hmset(String(req.body.userID), {
            "isOnline" : 0,
        });

        res.status(200).send(true);
    }).catch( err => {
        globalRouter.logger.error(URL + 'logout [error] error ' + err);
        res.status(404).send(err);
    })
})

router.post('/Edit/Password', async(req, res) => {
    const newhashedPwd = passwordController.getHashedPassword(req.body.newpassword);
    const hashedPwd = passwordController.getHashedPassword(req.body.password);

    await models.User.findOne({
        where : {
            UserID : req.body.UserID
        }
    }).then(result =>{
        if(globalRouter.IsEmpty(result.Password)){
            console.log("this User has no Password");

            let value = {
              "res" : 'HAVENT_PASSWORD'
            }
      
            res.status(200).send(value);
        }else{
            console.log("this User has Password");
            tablePassword = result.Password;
            return result
        }
    }).then(async result=>{
        if (String(result.Password) == hashedPwd/*== String(hashedPwd)*/) { //만약 테이블의 비밀번호와 클라이언트에서 입력된 기존 비밀번호 값의 암호화된 값이 같으면
            await models.User.update(
            {
                Password: newhashedPwd
            },
            {
                where: { UserID: body.userID }
            }).then(function (result) { //result if 문 .. 필요없을거같음.
                if (result>0) {
                    console.log(result, "-result, new password update success");
                    const responseValue = { //for 함수 잘 작동하는지 확인용
                    "아이디": body.id, //이건 그냥 확인용 
                    "새 비밀번호": body.newpassword,
                    "암호화 된 새 비밀번호": newhashedPwd
                    }
                    res.status(200).send(responseValue);
                } else {
                    console.log("NO UPDATED, i don't know what error");
                    res.status(200).send(false);
                }
            }).catch(err => {
                console.log('new password update failed', err);
                res.status(200).send(false);
            });
        }
        else {
            let value = {
                "res" : 'NOT_RIGHT'
            }
            res.status(200).send(value);
        }
    }).catch(err => {
        globalRouter.logger.error('[error] error ' + err);
        res.status(200).send(false);
      });
})

router.post('/Edit/ProfileInfo', async(req,res) => {
    console.log(URL + '/Edit/ProfileInfo Do');

    var fields = new Map();

    var files = [];

    var form = new formidable.IncomingForm();

    form.encoding = 'utf-8';
    form.uploadDir = './AllPhotos/Temp';
    form.multiples = true;
    form.keepExtensions = true;
  
    form.on('field', function (field, value) { //값 하나당 한번씩 돌아가므로,
      console.log(field);
      fields.set(field, value);
    });

    form.on('file', function (field, file) {
        if(field == 'images') files.push(file);
        else console.log('this file has no fieldname');
    }).on('end', async function() {

        var selectUser = await userFuncRouter.SelectByUserID(fields.get('userID'));

        if(globalRouter.IsEmpty(selectUser)){
            console.log(URL + '/Edit/ProfileInfo User is Empty');
            res.status(200).send(null);
        }else{
            await selectUser.update(
                {
                    NickName : fields.get('nickName'),
                    Location : fields.get('location'),
                    Information : fields.get('information'),
                    Sex : fields.get('sex'),
                    Birthday: fields.get('birthday')
                }
            ).then(updateResult => {
                console.log(URL + '/Edit/ProfileInfo User data is update success');
            }).catch(err => {
                globalRouter.logger.error(URL + '/Edit/ProfileInfo User data update Failed ' + err);
            })

            if(fields.get('isDeleteImage') == 1){
                console.log(URL + '/Edit/ProfileInfo Image Delete Call');
                s3Multer.fileDelete('ProfilePhotos/' + fields.get('userID'), selectUser.ProfileURL);

                await selectUser.update(
                    {
                        ProfileURL : ''
                    }
                ).then(updateResult => {
                    console.log(URL + "/Edit/ProfileInfo User ProfileImage data is update success");
                }).catch(err => {
                    globalRouter.logger.error(URL + '/Edit/ProfileInfo User ProfileImage data update Failed ' + err);
                })
            }else{
                if(files.length != 0){
                    var fileName = Date.now() + '.' + files[0].name.split('.').pop();
        
                    s3Multer.formidableFileUpload(files[0], 'ProfilePhotos/' + fields.get('userID') + '/' + fileName);

                    await selectUser.update(
                        {
                            ProfileURL : fileName
                        }
                    ).then(updateResult => {
                        console.log(URL + "/Edit/ProfileInfo User ProfileImage data is update success");
                    }).catch(err => {
                        globalRouter.logger.error(URL + '/Edit/ProfileInfo User ProfileImage data update Failed ' + err);
                    })
                }
            }

            res.status(200).send(await userFuncRouter.SelectByUserID(fields.get('userID')));
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
            console.log(URL + '/Edit/ProfileInfo success');
    });
})

router.post('/Check/Token', async(req,res) => {

    console.log("1. from client:", req.body.refreshToken);
    //문제가 있다... 진자로
    await models.User.findOne({
      where: { UserID: req.body.userID }
    }).then(result => {
      if (result.RefreshToken == '') { ////해당 id 가 가진 reftoken 값이 비어있으면
        console.log("this User has no RefreshToken");
        res.status(400).send("this User has no RefreshToken");
      } else { //있으면 
        //tableRefresh = result.RefreshToken; //테이블 reftoken 값 넣어!
        console.log("this User has RefreshToken");
        console.log("2. from table: ", result.RefreshToken); //이게 
        return result
      }
    }).then( async result =>{
      if (String(req.body.refreshToken) == String(result.RefreshToken)) {
        const VerifyRefresh = tokenController.VerifyRefToken(body.refreshToken);
        if (VerifyRefresh) { //인증 문제없이 되면
          const payload = {
            UserID: req.body.userID
          };
          const secret = tokenController.getSecret(ACCESS_TOKEN);
          const token = tokenController.getToken(payload, secret, ACCESS_TOKEN);
          //new access token 발급
          const response = {
            "AccessToken": token,
            "AccessTokenExpiredAt": tokenController.getExpired(token)
          }
          console.log(response); //response 값 확인
          res.status(200).json(response); //send new access token to client
        }
        else { //인증에 문제 생기면
          res.status(401).json({ success: false, message: 'Failed to authenticate refresh token. RE login please'/*, error: err */ });
        }
      }
      else { //DB 안의 refToken 값이랑 cli 에서 넘어온 refToken 값이랑 다르면
        res.status(404).send('Invalid request.. NOT refresh tkn expired error')
      }
    }).catch(err => {
      console.log('user register failed' + err);
      res.status(400).send(false);
    });
  })

module.exports = router;