var fs   = require('fs');
var path = require('path');

var env = {
    dir: {
        root: './',
        storefile:'./uploads',
        image: './public/images'
    },
    url: {
        upload: 'upload',
        download: 'download',
    },
    name: {
        altPng: 'mc_pvw_noimg.png',
    },
    mcdkeep: {
        place:     'db',   // 'fs' or 'db'
        limitsize: 20480,  // limit 20Kbytes (Original 4MBytes)
    },
    errmsg: {
        updNotFound:    'アップロードファイルがサーバーに存在しません。',
        updLimitOver:   '指定されたファイルは 4Mbytesを超えるためアップロードできません。',
        updNotFile:     '対象がファイルでないためアップロードできません。',
        updExecStat:    'アップロードされたファイルの情報取得に失敗しました。',
        updExecRename:  'アップロードされたファイルの処理に失敗しました。(rename)',
        updDbSelect:    'アップロードされたファイルのDB読取時にエラーが発生しました。',
        updDbCreate:    'アップロードされたファイルのDB登録時にエラーが発生しました。',
        updDbUpdate:    'アップロードされたファイルのDB更新時にエラーが発生しました。',
        makeList:       'リスト作成時にエラーが発生しました。',
        entryMcd:       '図面ファイルの登録に失敗しました。',
    }
};

// Prepare alternative png
var readbuf = '';
var previewData;

var getAltPng = function(callback) {
    
    console.log('(Check)(makeAltPng) Current directory: ' + process.cwd());
    
    if (typeof previewData !== 'undefined') {
        return callback(previewData);
    }
    
    var pngDir  = path.join(env.dir.root, env.dir.image);
    var pngPath = path.join(pngDir      , env.name.altPng);
    
    console.log('+----------------------------------------------+');
    console.log('| Create alternative png-data.                 |');
    console.log('| pngPath:' + pngPath);
    console.log('+----------------------------------------------+');
    
    //var readableStream = fs.createReadStream(pngPath);
    //previewData = new Buffer(readbuf, 'binary').toString('base64');
    var option = {
        encoding: 'base64',
    };
    var readableStream = fs.createReadStream(pngPath, option);
        
    console.log('createReadStream is ok');
        
    readableStream.on('data', function(chunk) {
        console.log('(Check)(_def) chunk(' + chunk.length + ')');
        readbuf += chunk;
    });
    
    readableStream.on('end', function() {
        previewData = readbuf;
        console.log('(Check)(_def) readbuf(' + readbuf.length + ')');
        readbuf='';
        //readbleStreamのcloseは不要 (autoClose:true)
        console.log('previewData: ' + previewData);
        callback(previewData);
    });
};

module.exports.getAltPng   = getAltPng;
module.exports.env         = env;