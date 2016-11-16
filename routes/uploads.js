var fs    = require('fs');
var path  = require('path');
var mydef = require('../models/_def');
//var accessFs = require('../models/_accessfs');
var accessDb = require('../models/_accessdb');
//var searchDb = require('../models/_searchdb');


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
    var uploadMsg = '';
    
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
            
            console.log('(Check)(upload) rename is done.');
        
            fs.unlink(tmpPath, function() { // (TODO) renameなので不要. 
                if (err) { // (TODO) errは拾っていない. 
                    console.log('(Err)(uploads) fs.unlink is fails... ' + tmpPath);
                    uploadMsg = mydef.env.errmsg.updExecRename + ':' + err.message;
                    return procRenderMain();                
                }
                
                if (mydef.env.mcdkeep.place === 'fs') {
                    uploadMsg = '対象ファイル('+ path.basename(targetPath) + ')(' + req.files.thumbnail.size + ' バイト)を登録しました。';
                }
                
                console.log('(Check)(upload) start statSync...');
                
                fs.stat(targetPath, function(err, statval) {
                    
                    console.log('(Check)(upload/procRenameFile/stat) #1');
                    
                    if (err) {
                        console.log('(Err) statSync is fails ... (' + targetPath + ')');
                        uploadMsg = mydef.env.errmsg.updExecStat + ':' + err.message;
                        return procRenderMain();
                    }
                    
                    console.log('(Check)(upload/procRenameFile/stat) #2');
                    
                    if (!(statval.isFile())) {
                        console.log('(Err) Upload is not regular file. (' + targetPath + ')');
                        uploadMsg = mydef.env.errmsg.updNotFile;
                        return procRenderMain();
                    }
                    fileSize = statval.size;
                    console.log('(Check)(upload) fileSize:' + fileSize);
                    
                    if (fileSize > mydef.env.mcdkeep.limitsize) {
                        uploadMsg = mydef.env.errmsg.updLimitOver;
                        console.log('(Check)(upload) ' + uploadMsg);
                        // 削除する.
                        fs.unlink(targetPath);
                        
                        return procRenderMain();
                    }
                    
                    console.log('(check)(upload/procRenameFile) fileSize:' + fileSize);
                    
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
    
        console.log('(Check)(upload) start entry record to db...');
        
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
                    uploadMsg = '対象ファイル('+ path.basename(targetPath) + ')(' + req.files.thumbnail.size + ' バイト)を登録しました。';
                    
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
        
        if (extname === '.mcd' || extname === '.png') {
            
            accessDb.entryPng(targetPath, function(err) {
                if (err) {
                    uploadMsg = mydef.env.errmsg.entryFileData + ':' + err.message;
                }
                
                console.log('(Check)(_uploads) #156');
                
                // 次の処理. 
                return procRenderMain();
            });
        } else {
            // 次の処理. 
            return procRenderMain();
        }
    }; // procAddInfoToDB
    
    // 
    var procRenderMain = function() {
        
        console.log('(Check) procRenderMain starts...');
        
        // uploadは、Ajaxで処理するため、画面遷移は発生しない。代わりにAjaxに渡すメッセージを送る. 
        res.end(uploadMsg);
        
        console.log('(Check)(uploads/procRenderMain) res.send(' + uploadMsg + ')');
        
/*
        // ファイルリスト作成.
        var makeList = accessDb.makeListDb;
        
        if (mydef.env.mcdkeep.place === 'fs') {
            makeList = accessFs.makeListFs;
        }
        
        console.log('(Check)(upload) start procRenderMain');
        
        makeList('', function(err, results) {
                
            if (err) {
                uploadMsg = mydef.env.errmsg.makeList + ':' + err.message;
                return procRenderMain();                
            }
            //console.log(results);
            console.log('(Check)(upload)makeList is done... filelList length is ' + results.length);
            
            res.render('main', {
                    title: '- Upload files -',
                    files: results,
                    status: status,
                    uploadMsg: uploadMsg,
                    }
            );
        });
*/
    };
    
    
    // 逐次処理 procRenameFile() -> procEntryDB() -> procAddInfoToDB() -> procRenderMain()
    if (bFound) {
        var extname = path.extname(targetPath).toLowerCase();
        console.log('(Check)(uploads/procAddInfoToDB) extname:' + extname);
        if (extname === '.svg') {
            fs.rename(tmpPath, targetPath, function(err) {
                if (err) {
                    console.log('(Err) fs.rename is fails... (' + tmpPath + ' -> ' + targetPath + ')');
                    return procRenderMain();                
                }
                
                accessDb.entrySvg(targetPath, function(err) {
                    uploadMsg = 'SVGデータをMCDに紐づけました。';
                    if (err) {
                        uploadMsg = 'SVGデータをMCDに紐づけ時にエラー:' + err.message;
                    }
                    // 次の処理. 
                    return procRenderMain();
                });
            });
        }
        else {
            procRenameFile();
        }
    }
    else {
        uploadMsg = mydef.env.errmsg.updNotFound;
        procRenderMain();
    }
};
