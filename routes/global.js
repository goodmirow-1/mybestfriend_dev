
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
const removePath = (p, callback) => { // A 
	fs.stat(p, (err, stats) => { 
	  if (err) return callback(err);
  
	  if (!stats.isDirectory()) { // B 
		console.log('이 경로는 파일');
		return fs.unlink(p, err => err ? callback(err) : callback(null, p));
	  }
  
	  console.log('이 경로는 폴더');  // C 
	  fs.rmdir(p, (err) => {  
		if (err) return callback(err);
  
		return callback(null, p);
	  });
	});
  };

const printResult = (err, result) => {
	if (err) return console.log(err);

	console.log(`${result} 를 정상적으로 삭제했습니다`);
};

function removefiles(p) {
	try { // D
		const files = fs.readdirSync(p);  
		if (files.length) 
		  files.forEach(f => removePath(path.join(p, f), printResult)); 
	} catch (err) {
	if (err) return console.log(err);
	}	  
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