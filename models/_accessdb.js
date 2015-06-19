var fs    = require('fs');
var path  = require('path');
var mydef = require('../models/_def');
var FileInfoModel = require('../models/_mongodb').model;


// 
// makeListDb
// 
var makeListDb = function(dir, callback) {
        
    var results = [];
        
    console.log('start makeListDB ... dir:' + dir);
    
    
    var query = {};
    
    if (dir === undefined || dir.length === 0 || dir === '*') {
        query = {};
    } else {
        query = {dir: dir};
    }
    console.log('query:' + query);
    console.log('query.dir:' + query.dir);
    
    FileInfoModel.find(query, function(err, docs) {
       
        if (err) {
            console.log('find occurs err:' + err);
            return callback(err, results);
        }
        console.dir('docs:' + docs);
        console.log('docs.length:' + docs.length);
        
        var doc;
        for (var i = 0, size = docs.length; i < size; ++i) {
            doc = docs[i];
            
            console.log('_id        :' + doc._id);
            //console.log('key        :' + doc.key);
            console.log('dir        :' + doc.dir );
            console.log('name       :' + doc.name );
            console.log('size       :' + doc.size );
            console.log('entryDate  :' + doc.entryDate );
            //console.log('registrant :' + doc.registrant );
            //console.log('description:' + doc.description );
            //console.log('preview    :' + doc.preview );
            
            var preview = doc.description;
            var onerec = {
                    filename:    doc.name, 
                    url:         path.join(doc.dir, doc.name), 
                    size:        doc.size,
                    entrydate:   doc.entryDate,
                    registrant:  doc.registrant,
                    description: doc.description,
                    preview:     doc.preview,
                };
            
            if (preview.length === 0) {
                // use alternative png
                mydef.getAltPng(function(previewData) {
                    onerec.preview = previewData;
                    console.log('mydef.getAltPng');
                    console.dir(previewData);
                });
                
            }
            results.push(onerec);
            
            console.log('(Check)(_accessdb/makeListDb)results.length:' + results.length);
        } // docs - loop
        
        callback(null, results);
    });
};

// 
// entryMcd
// 
var entryMcd = function(targetPath, callback) {
    var readbuf = '';
    var option = {
        encoding: 'base64',
    };
    var readableStream = fs.createReadStream(targetPath, option);
    
    readableStream.on('data', function(chunk) {
        readbuf += chunk;
        console.log('(Check)(upload) chunk(' + chunk.length + ')');
    });
    
    readableStream.on('end', function() {
        //var previewData = new Buffer(readbuf, 'binary').toString('base64');
        var previewData = readbuf;
        console.log('(Check)(upload) readbuf(' + readbuf.length + ')');
        readbuf = '';
        
        var query = {'$and':[
            {name: path.basename(targetPath)},
            {dir : relativeDir},
        ]};
        console.log("(Check)(upload) preview update query:" + query);
        
        FileInfoModel.findOne(query, function(err, doc) {
            if (err  || doc === null) {
                console.log('(Err)(_accessdb) Exist record is lost? (path:' + targetPath + ')');
                return callback(null, new Error(mydef.env.errmsg.dbSelect));
            }
            
            doc.preview = previewData;
            
            doc.save(function(err) {
                if (err) {
                    console.log('(Err) upload .png record is fails... (' + err + ')');
                    return callback(null, new Error(mydef.env.errmsg.dbUpdate));
                }
                // 次の処理. 
                procRenderMain();
            });
        });
    });
};

// 
// entryPng
// 
var entryPng = function(targetPath, callback) {
    var readbuf = '';
    var option = {
        encoding: 'base64',
    };
    var readableStream = fs.createReadStream(targetPath, option);
    
    readableStream.on('data', function(chunk) {
        readbuf += chunk;
        console.log('(Check)(upload) chunk(' + chunk.length + ')');
    });
    
    readableStream.on('end', function() {
        //var previewData = new Buffer(readbuf, 'binary').toString('base64');
        var previewData = readbuf;
        console.log('(Check)(upload) readbuf(' + readbuf.length + ')');
        readbuf = '';
        
        var query = {'$and':[
            {name: path.basename(targetPath)},
            {dir : relativeDir},
        ]};
        console.log("(Check)(upload) preview update query:" + query);
        
        FileInfoModel.findOne(query, function(err, doc) {
            if (err  || doc === null) {
                console.log('(Err)(_accessdb) Exist record is lost? (path:' + targetPath + ')');
                return callback(null, new Error(mydef.env.errmsg.dbSelect));
            }
            
            doc.preview = previewData;
            
            doc.save(function(err) {
                if (err) {
                    console.log('(Err) upload .png record is fails... (' + err + ')');
                    return callback(null, new Error(mydef.env.errmsg.dbUpdate));
                }
                // 次の処理. 
                procRenderMain();
            });
        });
    });
};

// 
// entryFileInfo
// 
var entryFileInfo = function(targetPath, fileSize, regUser, regComment, callback) {

    // targetPath ... /var/vcap/app/uploads/hoge.mcd
    var targetDir   = path.dirname(targetPath);
    var fileName    = path.basename(targetPath);
    var relativeDir = path.relative(mydef.env.dir.root, targetDir); // cf. uplods

    // 既存レコードチェック. 
    var query = {'$and':[
        {dir : relativeDir},
        {name: fileName},
    ]};
    
    console.log("(Check)(_accessdb/entryFileInfo)exist check query:" + query);
    
    FileInfoModel.findOne(query, function(err, doc) {
        if (err) {
            console.log('(Err) path(' + relativeDir + ',' + fileName + ') is not found. Err:' + err);
            return callback(err);
        }
        
        console.dir('(Check)findOne ... doc:' + doc);
        
        if (doc === null) { // not exist record -> create
            
            console.log('Entry new record to db...');
                
            // create
            var newData = {
                dir:         relativeDir,
                name:        fileName,
                size:        fileSize,
                registrant:  regUser,
                description: regComment,
            };
            
            var addFileInfo = new FileInfoModel(newData);
            addFileInfo.save(function(err, result) {
                if (err) {
                    console.log('(Err) save is err ' + err);
                    return callback(err);
                }
                console.log('(Check)(_accessdb/entryFileInfo)result: ' + result);
            });
        } else { // already exist record -> update
            console.log('Update existing record on db...');
            
            doc.size        = fileSize;
            doc.registrant  = regUser;
            doc.description = regComment;
            
            doc.save(function(err) {
                if (err) {
                    console.log('(Err)(_accessdb/entryFileInfo)update is failed.(path:' + targetPath + ')');
                    return callback(err);
                }
            });
        }
    });
};



module.exports.makeListDb    = makeListDb;
module.exports.entryMcd      = entryMcd;
module.exports.entryPng      = entryPng;
module.exports.entryFileInfo = entryFileInfo;