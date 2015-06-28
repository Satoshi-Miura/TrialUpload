//var path     = require('path');
var mydef    = require('../models/_def');
//var accessFs = require('../models/_accessfs');
//var accessDb = require('../models/_accessdb');
var searchDb = require('../models/_searchdb');

exports.index = function(req, res) {
    
    console.log('start index.js ....');
    
    var resultMsg   = '';
    
//    var makeList = searchDb.makeListDb;
    
//    if (mydef.env.mcdkeep.place === 'fs') {
//        makeList = accessFs.makeListFs;
//    }
    
    searchDb.makeListDb(req, function(err, status, results) {
        if (err) {
            resultMsg = mydef.env.errmsg.makeList + ':' + err.message;
        }
        
        //console.log(results);
        console.log('(Check)(index) filelList length is ' + results.length);
    
        res.render('main', {
                title: 'Express',
                files: results,
                status: status,
                uploadMsg: resultMsg,
            }
        );
    });
};
