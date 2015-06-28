var fs    = require('fs');
var path  = require('path');
var mydef      = require('../models/_def');
var dbresource = require('../models/_mongodb');
var accDwg     = require('../models/_accessdwg');


// 
// makeListDb
// 
var makeListDb = function(dir, callback) {
    // callback is function(err, results)
    
    var results = [];    
    var query = {};
    console.log('(Check)(_accessdb/makeListDb)start makeListDB ... dir:' + dir);
    
    if (!dir || dir === undefined || dir.length === 0 || dir === '*') {
        query = {};
    } else {
        query = {dir: dir};
    }
    //console.log('(Check)(_accessdb/makeListDb) query:' + query);
    
    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.find(query, function(err, docs) {
        if (err) {
            console.log('find occurs err:' + err);
            return callback(err, results);
        }
        //console.dir('docs:' + docs);
        //console.log('docs.length:' + docs.length);
        
        var doc;
        for (var i = 0, size = docs.length; i < size; ++i) {
            doc = docs[i];
            
            console.log('_id        :' + doc._id);
            //console.log('dir        :' + doc.dir );
            console.log('name       :' + doc.name );
            //console.log('size       :' + doc.size );
            //console.log('entryDate  :' + doc.entryDate );
            
            var downloadDir = mydef.env.url.downloads; // dont use doc.dir
            var onerec = {
                    filename:    doc.name, 
                    url:         path.join(downloadDir, doc.name), 
                    size:        doc.size,
                    entrydate:   doc.entryDate,
                    registrant:  doc.registrant,
                    description: doc.description,
                    preview:     doc.preview,
                    svgurl:      mydef.env.url.svg + '/' + doc._id,
            };
            
            if (doc.preview === undefined || doc.preview.length === 0) {
                // use alternative png
                mydef.getAltPng(function(previewData) {
                    onerec.preview = previewData;
                    console.log('get pool data(mydef.getAltPng)');
                    //console.dir(previewData);
                });
                
            }
            results.push(onerec);
            
            console.log('(Check)(_accessdb/makeListDb)results.length:' + results.length);
        } // docs - loop
        
        callback(null, results);
    });
};


//
// Utility - getDbDirFromFilePath
//
var getDbDirFromFilePath = function(targetPath) {
    // input : /home/vcap/app/uploads/xxx/yyy.mcd (include filename)
    // output: xxx
    var workDir     = path.dirname(targetPath);         // home/vcap/app/uploads/xxx
    var uploadDir   = path.join(mydef.env.dir.root, mydef.env.url.uploads); // home/vcap/app/uploads
    var relativeDir = path.relative(uploadDir, workDir);// xxx
    
    console.log('(Check)(_accessdb/getDbDirFromFilePath)(' + targetPath + ')->(' + relativeDir + ')');
    
    return relativeDir;
};


//
// Utility - getFileInfoOne
//
var getFileInfoOne = function(dir, name, callback) {
    // callback is function(err, doc)

    var query = {};
    // (TODO) add more query-condition code
    if (!dir || dir === undefined || dir.length === 0 || dir === '*') {
        if (name.indexOf('*') != (-1)) {
            query.$where ='/' + name + '/.test(this.name)';
        } else {
            query.name = name;
        }
    } else {
        query = {'$and':[
            {dir : dir},
            {name: name},
        ]};
    }
    
    console.log("(Check)(_accessdb/getFileInfoOne) query:" + query);
    
    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.findOne(query, function(err, doc) {
        if (err) {
            console.log('(Err) path(' + dir + ',' + fileName + ') is not found. Err:' + err);
            return callback(err);
        }
        
        console.dir('(Check)findOne ... doc:' + doc);
        
        if (doc === null) { // not exist record 
            return callback(null, null);
        }
        return callback(null, doc);
    });
};


//
// Utility - getFileDataOne
//
var getFileDataOne = function(dir, name, callback) {
    // callback is function(err, doc)

    getFileInfoOne(dir, name, function(err, doc) {
        if (err) {
            return callback(err, null);
        }
        var query = {_id: doc.fileDataId};
        console.log("(Check)(_accessdb/getFileDataOne) filedata query:" + query);
        
        var fileDataModel = dbresource.model.fileData;
        fileDataModel.findOne(query, function(err, doc) {
            if (err) {
                console.log('(Err) path(' + dir + ',' + fileName + ') is not found. Err:' + err);
                return callback(err);
            }
            
            console.dir('(Check)(_accessdb/getFileDataOne) filedata - findOne ... doc:' + doc);
            
            if (doc === null) { // not exist record 
                return callback(null, null);
            }
            return callback(null, doc);
        });
    });
};


//
// entryFileData
// 
var entryFileData = function(targetPath, callback) {
    // callback is function(err)
    
    //var extname = path.extname(targetPath).toLowerCase();
    //console.log('(Check)(uploads/procAddInfoToDB) extname:' + extname);
    //if (extname === '.mcd' || extname === '.txt') {
    //    return callback(null);
    //}
    
    fs.readFile(targetPath, function (err, readData) {
        if (err) {
            console.log('(Err)(_accessdb/entryFileData) read file is fails... Err:' + err.message);
            return callback(new Error(mydef.env.errmsg.updExecRead));
        }
        
        console.log('(Check)(_accessdb/entryFileData) read file data(' + readData.length + ')');
        
//        var targetDir   = path.dirname(targetPath);
        var fileName    = path.basename(targetPath);
//        var relativeDir = path.relative(mydef.env.dir.root, targetDir); // cf. uplods
        var relativeDir = getDbDirFromFilePath(targetPath);

        // exist record?
        getFileDataOne(relativeDir, fileName, function(err, dataDoc) {
            
            if (err) {
                console.log('(Err)(_accessdb/entryFileData) Exist FileData record is lost? (path:' + targetPath + ')');
                return callback(new Error(mydef.env.errmsg.updDbSelect));
            }
            
            if (dataDoc === null) {
                // create FileData record
            
                console.log('Entry new fileData record to db...');
                    
                getFileInfoOne(relativeDir, fileName, function(err, infoDoc) {
                    if (!infoDoc || err) {
                        console.log('(Err)(_accessdb/entryFileData) Exist FileInfo record is lost? (path:' + targetPath + ')');
                        return callback(new Error(mydef.env.errmsg.updDbSelect));
                    }
                    
                    // creat
                    var newData = {
                        fileInfoId: infoDoc._id,
                        data: readData,
                    };
                    
                    var fileDataModel = dbresource.model.fileData;
                    var addFileData = new fileDataModel(newData);
                    addFileData.save(function(err, dataDoc) {
                        if (err) {
                            console.log('(Err) save is err ' + err);
                            return callback(new Error(mydef.env.errmsg.updDbCreate));
                        }
                        console.log('(Check)(_accessdb/entryFileData)result: ' + dataDoc);
                        
                        // rewrite fileInfo - fileDataId 
                        infoDoc.fileDataId = dataDoc._id;
                        
                        infoDoc.save(function(err) {
                            if (err) {
                                console.log('(Err) update fileinfo-record is fails... (' + err + ')');
                                return callback(new Error(mydef.env.errmsg.updDbUpdate));
                            }
                            return callback(null);
                        });
                    });
                });
            }
            else {
                // write mcd data to fileData record
                dataDoc.data = readData;
                
                dataDoc.save(function(err) {
                    if (err) {
                        console.log('(Err) upload .png record is fails... (' + err + ')');
                        return callback(new Error(mydef.env.errmsg.updDbUpdate));
                    }
                    return callback(null);
                });
            }
        });
    });
};


// 
// entryPng
// 
var entryPng = function(targetPath, callback) {
    // callback is function(err)
    
    // fs , db 共に共通する処理. 
    var updatePreviewToDb = function(targetPath, pngData, cb2) {
        // cb2(callback) is function(err)
        
        console.log('(Check)(_accessdb/entryPng) start uodateDb...');
        
        var fileName    = path.basename(targetPath);
        var relativeDir = getDbDirFromFilePath(targetPath);

        getFileInfoOne(relativeDir, fileName, function(err, doc) {
            if (err  || doc === null) {
                console.log('(Err)(_accessdb/entryPng) Exist record is lost? (path:' + targetPath + ')');
                return cb2(new Error(mydef.env.errmsg.updDbSelect));
            }
            
            console.log('(Check(_accessdb/entryPng) set doc.preview -< pngData');
            
            doc.preview = pngData;
            
            doc.save(function(err) {
                if (err) {
                    console.log('(Err) upload .png record is fails... (' + err + ')');
                    return cb2(new Error(mydef.env.errmsg.updDbUpdate));
                }
                
                console.log('(Check)(_accessdb/entryPng) doc.save complete...');
                
                return cb2(null);
            });
        });
    };
    
    var extname = path.extname(targetPath).toLowerCase();
    console.log('(Check)(_accessdb/entryPng) extname:' + extname);
    
    if (extname === '.png') {
        
        console.log('(Check)(_accessdb/entryPng) Start .png proc...');
        
        // get png-data from .png file
        var option = {
            encoding: 'base64',
        };
        var readbuf = '';
        
        var readableStream = fs.createReadStream(targetPath, option);
        
        readableStream.on('data', function(chunk) {
            readbuf += chunk;
            console.log('(Check)(upload) chunk(' + chunk.length + ')');
        });
        
        readableStream.on('end', function() {
            updatePreviewToDb(targetPath, readbuf, function(err) {
                if (err) {
                    callback(err);
                }
                return callback(null);
            });
        });
    }
    else if(extname === '.mcd') {
        
        console.log('(Check)(_accessdb/entryPng) Start .mcd proc...');
        
        accDwg.getPreviewBase64FromMcd(targetPath, function(err, pngData) {
            if (err) {
                callback(err);
            }
            
            console.log('(Check)(_accessdb/entryPng) #1');
            console.log('pngData:');
            console.log(pngData);
            
            if (pngData) {
                updatePreviewToDb(targetPath, pngData, function(err) {
                    if (err) {
                        callback(err);
                    }
                    console.log('(Check)(_accessdb/entryPng) #1-2');
                    return callback(null);
                });
            }
            else {
                console.log('(Check)(_accessdb/entryPng) #2-1');
                return callback(null);
            }
        });
    }
};

// 
// entryFileInfo
// 
var entryFileInfo = function(targetPath, fileSize, regUser, regComment, callback) {
    // callback is function(err)

    // targetPath ... /var/vcap/app/uploads/hoge.mcd
//    var targetDir   = path.dirname(targetPath);
    var fileName    = path.basename(targetPath);
//    var relativeDir = path.relative(mydef.env.dir.root, targetDir); // cf. uplods
    var relativeDir = getDbDirFromFilePath(targetPath);

    // 既存レコードチェック. 
    getFileInfoOne(relativeDir, fileName, function(err, doc) {
    
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
            
            var fileInfoModel = dbresource.model.fileInfo;
            
            console.log('fileInfoModel:' + fileInfoModel);
            
            var addFileInfo = new fileInfoModel(newData);
            addFileInfo.save(function(err, result) {
                if (err) {
                    console.log('(Err) save is err ' + err);
                    return callback(err);
                }
                console.log('(Check)(_accessdb/entryFileInfo)result: ' + result);
                
                return callback(null);
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
                return callback(null);
            });
        }
    });
};

//
// readFileDb
//
var readFileDb = function(res, dir, name, callback) {
    // callback is function(err, filePath)
    
    console.log('(Check)(_accessdb/readFileDb) dir:' + dir + ', name:' + name);
    
    // Search FileData
    getFileDataOne(dir, name, function(err, doc) {
        
        if (err || doc === null) {
            console.log('(Err)(_accessdb/readFileDb) Exist filedata-record is lost? (_id:' + fileDataId);
            return callback(new Error(mydef.env.errmsg.updDbSelect));
        }
        
        var targetDir  = path.join(mydef.env.dir.root, mydef.env.url.uploads);
        var targetPath = path.join(targetDir, name);
        
        console.log('(Check)(_accessdb/readFIleDb) targetPath:' + targetPath);
        
        //var wt = fs.createWriteStream(targetPath, {flags: 'wx'}); // EEXIST?
        var wt = fs.createWriteStream(targetPath);
        
        wt.on('error', function(err) {
            console.log('(Err) createWriteStream: ' + err);
        });
        
        console.log('(Check)(_accessdb/readFIleDb) wt:' + wt);
        console.log('  -> doc.data.length:' + doc.data.length);
        
        wt.write(doc.data);
        wt.end();
        
        wt.on('close', function() {
            callback(null, targetPath);
        });
    });
};


// 
// entrySvg
// 
var entrySvg = function(targetPath, callback) {
    // callback is function(err)
    
    // fs , db 共に共通する処理. 
    var updateSvgToDb = function(targetPath, svgData, cb2) {
        // cb2(callback) is function(err)
        
        console.log('(Check)(_accessdb/entrySvg) start uodateDb...');
        
        var pathParse = path.parse(targetPath);
        var fileName  = pathParse.name + '\\.*';
        
        var relativeDir = getDbDirFromFilePath(targetPath);
        
        console.log('(Check)(_accessdb/entrySvg)    fileName:' + fileName);
        console.log('(Check)(_accessdb/entrySvg) relativeDir:' + relativeDir);
        
        getFileInfoOne(relativeDir, fileName, function(err, doc) {
            if (err  || doc === null) {
                console.log('(Err)(_accessdb/entrySvg) Exist record is lost? (path:' + targetPath + ')');
                return cb2(new Error(mydef.env.errmsg.updDbSelect));
            }
            
            console.log('(Check(_accessdb/entrySvg) set doc.preview -< pngData');
            
            doc.svg = svgData;
            
            doc.save(function(err) {
                if (err) {
                    console.log('(Err) upload .svg data into record is fails... (' + err + ')');
                    return cb2(new Error(mydef.env.errmsg.updDbUpdate));
                }
                
                console.log('(Check)(_accessdb/entrySvg) doc.save complete...');
                
                return cb2(null);
            });
        });
    };
    
    
    // get svg-data from .svg file
    var option = {
        encoding: 'base64',
    };
    var readbuf = '';
    var readableStream = fs.createReadStream(targetPath, option);
    
    readableStream.on('data', function(chunk) {
        readbuf += chunk;
        console.log('(Check)(upload) chunk(' + chunk.length + ')');
    });
    
    readableStream.on('end', function() {
        updateSvgToDb(targetPath, readbuf, function(err) {
            if (err) {
                callback(err);
            }
            return callback(null);
        });
    });
};


module.exports.makeListDb    = makeListDb;
module.exports.entryFileData = entryFileData;
module.exports.entryPng      = entryPng;
module.exports.entryFileInfo = entryFileInfo;
module.exports.readFileDb    = readFileDb;
module.exports.getDbDirFromFilePath = getDbDirFromFilePath;
module.exports.entrySvg      = entrySvg;
