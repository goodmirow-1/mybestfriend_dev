const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const fs = require('fs');
aws.config.loadFromPath(__dirname + '/../config/s3.json');

const s3 = new aws.S3();

const myBucket = 'myvef-bowl-production-bucket'; //myvef-bowl-production-bucket
const myAcl = 'public-read';

module.exports = {
    fileUpload : function upload(destinationPath, fileName) {
        return multer({
            storage: multerS3({
                s3: s3,
                bucket: myBucket,
                acl: myAcl,
                key: function (req, file, cb) {
                    console.log(file);
                    cb(null, destinationPath + "/" +  fileName);
                },
            })
        })
    },
    fileDelete :  function deletFile(destinationPath, fileName) {
        s3.deleteObject({
                Bucket : myBucket,
                Key : destinationPath + '/' + fileName
            }, (err , data) => {
                if(err) {throw err;} 
                console.log('s3 deleteObject ', data);
        })
    },
    formidableFileUpload : function formidableUpload(file, fileName){
        var params = {
            Bucket : myBucket,
            Key : fileName,
            ACL : myAcl,
            Body : fs.createReadStream(file.path)
        };

        s3.upload(params, function(err, data) {
            if(err) throw err;

            console.log('s3 upload success ' + data );
        });
    },
    formidablePathUpload : function formidableUpload(path, fileName){
        var params = {
            Bucket : myBucket,
            Key : fileName,
            ACL : myAcl,
            Body : fs.createReadStream(path)
        };

        s3.upload(params, function(err, data) {
            if(err) throw err;

            console.log('s3 upload success ' + data );
        });
    },
}