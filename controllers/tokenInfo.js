const jwt = require('jsonwebtoken');
const config = require('../config/configure'); //for secret data
const { secret } = require('../config/configure');

const ACCESS_TOKEN = 0;
const REFRESH_TOKEN = 1;

function getSecret(x) {
    if (x == ACCESS_TOKEN) { // 0 = accesstoken sk
        const secret = config.secret;
        return secret;
    } else if (x == REFRESH_TOKEN) { // 1 = refreshtoken sk
        const secret = config.refreshsecret;
        return secret;
    }
}

function getToken(payload, secretKey, x) {
    if (x == ACCESS_TOKEN) { // 0 = accesstoken
        var options = { algorithm: 'HS256', expiresIn: config.tokenLife, issuer: 'accTokenTest', subject: 'accTokenInfo' };
    }
    else if (x == REFRESH_TOKEN) { // 1 = refreshtoken
        var options = { algorithm: 'HS256', expiresIn: config.refreshTokenLife, issuer: 'refTokenTest', subject: 'refTokenInfo' };
    }
    return jwt.sign(payload, secretKey, options);
}

function VerifyRefToken(reftoken) { //ref verfy 는 
    const x = jwt.verify(reftoken, config.refreshsecret, function (err, decoded) {
        if (err) {
            console.log(err) //전체 결과 값
            return false;
        }
        //err 값으로 어떤 에러인지 알수 있음
        else {
            console.log(decoded) //전체 결과 값
            console.log(decoded.userid) //결과값 json 에서 이렇게 값 하나만 따로 뺄 수 있음
            return true;
        }
    });
    if (x == true) {
        return true;
    } else {
        return false;
    }
}

function Auth(req, res) { //이건 그냥 verify 확인용 -> 쓰이나 이게?
    //token verify
    const token = req.header('refreshToken')    //헤더 확인하거나 body에서 값 확인 가능

    if (!token) {
        res.status(400).json({
            'status': 400,
            'msg': 'not logged in, Token 없음'
        });
    }

    const checkToken = new Promise((resolve, reject) => {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) reject(err);
            resolve(decoded);
        });
    });

    const onError = (error) => {
        res.status(403).json({
            success: false,
            message: error.message //for error check
        });
    }
    //이거 없으면 postman 쪽에서 무슨 에러인지뭔지 알 수가없게됨

    checkToken.then(
        token => {
            console.log(token);
            res.status(200).json({
                'status': 200,
                'msg': 'verify success',
                token
            });
        }
    ).catch(onError);
}

function getExpired(token){
    return jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
            console.log(err) //전체 결과 값
            return false;
        }else {
            console.log(decoded) //전체 결과 값
            //console.log(decoded.exp) //결과값 json 에서 이렇게 값 하나만 따로 뺄 수 있음
            return decoded.exp;
        }
    });
}

module.exports.getToken = getToken;
module.exports.getSecret = getSecret;
module.exports.Auth = Auth;
module.exports.VerifyRefToken = VerifyRefToken;
module.exports.getExpired = getExpired;