//var path     = require('path');
var mydef    = require('../models/_def');
//var accessFs = require('../models/_accessfs');
//var accessDb = require('../models/_accessdb');
var searchDb = require('../models/_searchdb');

exports.listfile = function(req, res) {
    
    console.log('start listfile.js ....');
    //console.dir(listfile);
    
    var resultMsg   = '';
    
//    var makeList = searchDb.makeListDb;
    
//    if (mydef.env.mcdkeep.place === 'fs') {
//        makeList = accessFs.makeListFs;
//    }

    // (accessDb)makeList('', function(err, results) {
    searchDb.makeListDb(req, function(err, status, results) {
        if (err) {
            resultMsg = mydef.env.errmsg.makeList + ':' + err.message;
        }
        
        //console.log(results);
        console.log('(Check)(listfile)filelList length is ' + results.length);
    
        res.render('main', {
                title: '- List files -',
                files: results,
                status: status,
                uploadMsg: resultMsg,
            }
        );
    });
};