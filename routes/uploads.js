var fs    = require('fs');
var path  = require('path');
var mydef = require('../models/_def');
var accessFs = require('../models/_accessfs');
var accessDb = require('../models/_accessdb');


exports.post = function(req, res) {
    
    // req.files は express3まで 
    //var tmpPath = req.files.thumbnail.path;
    //var targetPath = './uploads/' + req.files.thumbnail.name;
    //res.send('tmpPath:' + tmpPath + ',   File uploaded to: ' + targetPath + ' - ' + req.files.thumbnail.size + ' bytes.');
    
    // express4 は multer (http://qiita.com/PianoScoreJP/items/a56e7b3509dcc08cb7e9)
    var targetPath, tmpPath;
    console.dir(req.files);
    
    // (TODO) 複数ファイル対応. 
    //tmpPath = req.files.thumbnail.path; // get '../uploads/xxxx’ -> ENOENT 
    tmpPath = path.join(mydef.env.dir.root, path.join(mydef.env.dir.storefile, path.basename(req.files.thumbnail.path)));
    console.log('(Check)(uploads) tmpPath:' + tmpPath);
    
    var targetDir  = path.join(mydef.env.dir.root, mydef.env.dir.storefile);
    targetPath = path.join(targetDir, req.files.thumbnail.originalname);
    
    console.log('(Check)(uploads)targetPath:' + targetPath);
    
    console.log('(Check)(uploads) req.files.thumbnail.size:' + req.files.thumbnail.size);
    
    var fileSize = 0;
    
    var uploadMsg;
    
    // upload有無. 
    var bFound = fs.existsSync(tmpPath);
    
    console.log(tmpPath + ' ... ' + bFound);
    
    
    // Uploadされたファイルを一時ファイル名から指定ファイル名にrenameする. 
    var procRenameFile = function() {
        
        fs.rename(tmpPath, targetPath, function(err) {
            if (err) {
                console.log('(Err) fs.rename is fails... (' + tmpPath + ' -> ' + targetPath + ')');
                uploadMsg = mydef.env.errmsg.updExecRename + ':' + err.message;
                return procRenderMain();                
            }
            
            console.log('(Check) rename is done.');
        
            fs.unlink(tmpPath, function() {
                if (err) {
                    console.log('(Err)(uploads) fs.unlink is fails... ' + tmpPath);
                    uploadMsg = mydef.env.errmsg.updExecRename + ':' + err.message;
                    return procRenderMain();                
                }
                uploadMsg = '対象ファイル('+ targetPath + ', ' + req.files.thumbnail.size + ' バイト)を登録しました。';
                
                console.log('(Check) start statSync...');
                
                fs.stat(targetPath, function(err, statval) {
                    if (err) {
                        console.log('(Err) statSync is fails ... (' + targetPath + ')');
                        uploadMsg = mydef.env.errmsg.updExecStat + ':' + err.message;
                        return procRenderMain();
                    }
                    if (!(statval.isFile())) {
                        console.log('(Err) Upload is not regular file. (' + targetPath + ')');
                        uploadMsg = mydef.env.errmsg.updNotFile;
                        return procRenderMain();
                    }
                    fileSize = statval.size;
                    
                    if (fileSize > mydef.env.mcdkeep.limitsize) {
                        uploadMsg = mydef.env.errmsg.updLimitOver;
                        // 削除する.
                        fs.unlink(targetPath);
                        
                        return procRenderMain();
                    }
                    
                    console.log('(check) fileSize:' + fileSize);
                    
                    // 次の処理. 
                    return procEntryDB();
                });
            });
        });
    }; // procRenameFile

    // DBにUploadされたファイルの情報を登録する. 
    // ここは、mcdkeep.place が 'fs','db'どちらでも実行する. 
    var regUser    = 'Bluemix';
    var regComment = 'No comment';
    
    var procEntryDB = function() {
    
        console.log('(Check) start entry record to db...');
        
        // 
        accessDb.entryFileInfo(targetPath, fileSize, regUser, regComment, function(err) {
            if (err) {
                console.log('(Err) accessDb.entryFileInfo fails...' + targetPath );
                uploadMsg = mydef.env.errmsg.updDbUpdate + ':' + err.message;
                return procRenderMain();                
            }
            if (mydef.env.mcdkeep.place === 'db') {
                accessDb.entryFileData(targetPath, function(err) {
                
                    if (err) {
                        uploadMsg = mydef.env.errmsg.entryFileData + ':' + err.message;
                        return procRenderMain();                
                    }
                    //console.log(results);
                    console.log('accessDB.entryFileData is done... ');
                    
                    // 次の処理. 
                    return procAddInfoToDB();
                });
                // 次の処理. 
                return procAddInfoToDB();
            }
        });
    }; // procEntryDB
    
    // 
    var procAddInfoToDB = function() {
        // 拡張子「.png」「.mcd」について、ファイルを読み込みDBにレコード追加する.
        // png は　BASE64変換して、fileinfoスキーマに格納する.
        // mcd は　バイナリそのままでfiledataスキーマに格納する.
        // 将来は、mcdからpreviewデータを読出し, node-pngでpngに変換した後にfileinfoスキーマに格納する.
        var extname = path.extname(targetPath).toLowerCase();
        
        console.log('(Check)(uploads/procAddInfoToDB) extname:' + extname);
        
        if (extname === '.mcd') {
            // comming soon.     
            
            return procRenderMain();
            
        } else if (extname === '.png') { // temporary proc
            
            accessDb.entryPng(targetPath, function(err) {
                if (err) {
                    uploadMsg = mydef.env.errmsg.entryFileData + ':' + err.message;
                }
            });
            
            // 次の処理. 
            return procRenderMain();
        } else {
            // 次の処理. 
            return procRenderMain();
        }
    }; // procAddInfoToDB
    
    // 
    var procRenderMain = function() {    
        // ファイルリスト作成.
        var makeList = accessDb.makeListDb;
        
        if (mydef.env.mcdkeep.place === 'fs') {
            makeList = accessFs.makeListFs;
        }
        
        makeList('', function(err, results) {
                
            if (err) {
                uploadMsg = mydef.env.errmsg.makeList + ':' + err.message;
                return procRenderMain();                
            }
            //console.log(results);
            console.log('makeList is done... filelList length is ' + results.length);
            
            res.render('main', {
                    title: '- Upload files -',
                    files: results,
                    uploadMsg: uploadMsg,
                    }
            );
        });
    };
    
    // 逐次処理 procRenameFile() -> procEntryDB() -> procAddInfoToDB() -> procRenderMain()
    if (bFound) {
        procRenameFile();
    }
    else {
        uploadMsg = mydef.env.errmsg.updNotFound;
        procRenderMain();
    }
};
