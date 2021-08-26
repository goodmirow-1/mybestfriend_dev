//비밀번호 암호화
const crypto = require('crypto');
const config = require('../config/configure'); //for secret data

function getHashedPassword( password ) {
    const HashedPassword = crypto.createHmac('sha256', config.pwdsecret).update( password ).digest('base64');
    return HashedPassword;
}

module.exports.getHashedPassword = getHashedPassword;
