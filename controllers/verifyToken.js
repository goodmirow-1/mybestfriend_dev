//token verify 구현하려는 코드
//middle ware
const { debug } = require('../libs/myWinston');
const config = require('../config/configure') //for config file 
const jwt = require('jsonwebtoken');

//middle ware
module.exports = (req, res, next) => {
    console.log(req.headers);
    const token = req.header('accessToken') //수정해야한다

    console.log(token);
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) { //expired 이면 Refresh 확인해서 Access 다시 지급하고 아니면 로그인 시킴
                return res.status(401).json({ success: false, message: 'Failed to authenticate token.', error: err });
            }
            //err 값으로 어떤 에러인지 알수 있음
            else {
                // if everything is good, save to request for use in other routes
                console.log("what is decoded return val in Middleware:", decoded) //전체 결과 값
                console.log("what is Date.now(): ", Date.now()) //전체 결과 값
                console.log("what is decoded.exp * 1000: ", decoded.exp * 1000) //전체 결과 값
                console.log("what is decoded EXPIRED val in Middleware:", decoded.exp) //전체 결과 값
                //console.log("what is specific User Email val in Middleware:",decoded.EmailID) //결과값 json 에서 이렇게 값 하나만 따로 뺄 수 있음
                //그니까 이걸로 userid 랑 현재 로그인되어있는 userid 랑도 비교할 수 있지 않을 까?
                req.decoded = decoded; // If no error, token info is returned in 'decoded'
                next();
            }
        });
    }
    else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
};
