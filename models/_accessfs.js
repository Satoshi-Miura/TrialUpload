var path  = require('path');
var fs    = require('fs');
var mydef = require('../models/_def');


    
var makeListFs = function(dir, callback) {
        
    var results = [];
        
    fs.readdir(dir, function(err, files){
        
        if (err) {
            console.log('(Err) readdir(%s) is failed...', dir);
            return callback(null, results);
        }
        
        //console.log('after readdir');
        //console.dir(files);
            
        var pending = files.length;
        if (!pending) { // ファイル数が0件? 
            //console.log('Call callback -a');
            return callback(null, results);
        }
            
        files.map(function(file) {
            return path.join(dir, file);            
        }).filter(function(file){
            //console.log('(Before Filter) file:%s', file);
            
            //return fs.statSync(file).isFile() && /.*\.txt$/.test(file); //絞り込み
            return fs.statSync(file).isFile(); //絞り込み
            // Directory階層化を考慮するなら　http://shimz.me/blog/node-js/2944
        }).forEach(function (file) {
            
            var stat = fs.statSync(file);
            
            //console.log('(After  Filter) file:%s, size: %d', file, stat.size);
            
            var fname = path.basename(file);
            
            var entry = {
                name:         fname,
                url:          path.join(mydef.env.url.download, fname),
                size:         stat.size,
                entryDate:    stat.mtime,
                registrant:   'bluemix',
                description:  'プレビューはサンプルです。',
            };
            mydef.getAltPng(function(previewData) {
                entry.preview = previewData;
                console.log('entry.preview');
                console.dir(entry.preview);
            });

            results.push(entry);
                
            //console.log("(A) results size is " + results.length);
                
            if (!--pending) { // 全ファイルの処理が終わったらコールバックを呼び出す. 
                callback(null, results);
                //console.log('Call callback -b');
            }
        });

        //console.log("(B) results size is " + results.length);
        
    });
    //console.log("(C) results size is " + results.length);
};

module.exports.makeListFs = makeListFs;
