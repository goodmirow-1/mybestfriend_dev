
const fs = require('fs'),
moment = require('moment'),
path = require('path');

const { isEmpty } = require('underscore');
const logger = require('../libs/myWinston');

const redis = require('redis');
const client = redis.createClient(6379, "127.0.0.1");

require('moment-timezone');

moment.tz.setDefault("Asia/Seoul");

function IsEmpty(value) {
    if (value === null) return true
    if (typeof value === 'undefined') return true
    if (typeof value === 'string' && value === '') return true
    if (Array.isArray(value) && value.length < 1) return true
    if (value == '{}') return true
    if (typeof value === 'object' && value.constructor.name === 'Object' && Object.keys(value).length < 1 && Object.getOwnPropertyNames(value) < 1) return true
    if (typeof value === 'object' && value.constructor.name === 'String' && Object.keys(value).length < 1) return true // new String()

    return false;
};

async function CreateOrUpdate(model, where, newItem) {
	const foundItem = await model.findOne({ where });

	if (!foundItem) {
		const item = await model.create(newItem);
		return { item, created: true };
	}

	await model.update(newItem, { where });

	const item = foundItem;

	return { item, created: false };
}

async function CreateOrDestroy(model, where) {
	const foundItem = await model.findOne({ where });
	if (!foundItem) {
		const item = await model.create(where);
		return { item, created: true };
	}

	const item = await model.destroy({ where });
	return { item, created: false };
}

function makeFolder(dir) { //폴더 만드는 로직
    if (!fs.existsSync(dir)) { //만약 폴더 경로가 없다면
        fs.mkdirSync(dir); //폴더를 만들어주시오
    } else {
        console.log('already folder exist!');
    }
}

function getfilename(x) {
	var splitFileName = x.split(".");
	var name = splitFileName[0];
	return name;
}

function getImgMime(x) {
	var splitFileName = x.split(".");
	var mime = splitFileName[1];
	return mime;
}

//디렉토리랑 mime type 까지 싹다 인자로 받기

async function removefiles(x) {
return new Promise(resolve => {
	x.forEach(f => { //폴더 경로마다
		fs.readdir(f, function (err, files) { //폴더내의 파일마다
			if (err) {
				console.log(err);
			} else {

				if (files.length == 0) {
					console.log("folder is already empty")
					resolve('good');
				}
				else { //파일 있으면
					files.forEach(ff => { //파일마다
						fs.unlink(path.join(f, ff), function (err) {
							if (err) {
								console.log('err:', err)
								throw err;
							}
							console.log('file deleted');
							resolve('good');
						});
					})
				}
			}
		})
	})
});
}

function getWordLen(x) { //검색 필터 단어 나누는 용
    var splitFileName = x.split("|");
    var len = splitFileName.length;
    return len;
    }
    
    function getWords(x) { //검색 필터 단어 나누는 용
    var splitFileName = x.split("|");
    return splitFileName;
    }
    
    
    function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    }   
    

//전역변수
module.exports.logger = logger;
module.exports.client = client;

//전역함수
module.exports.CreateOrUpdate = CreateOrUpdate;
module.exports.CreateOrDestroy = CreateOrDestroy;

module.exports.makeFolder = makeFolder;
module.exports.getfilename = getfilename;
module.exports.getImgMime = getImgMime;
module.exports.removefiles = removefiles;
module.exports.IsEmpty = IsEmpty;

module.exports.getWordLen = getWordLen;
module.exports.getWords = getWords;
module.exports.sleep = sleep;