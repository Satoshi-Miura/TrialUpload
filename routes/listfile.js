//var path     = require('path');
var mydef    = require('../models/_def');
var accessFs = require('../models/_accessfs');
var accessDb = require('../models/_accessdb');

exports.listfile = function(req, res) {
    
    console.log('start listfile.js ....');
    //console.dir(listfile);
    
    var resultMsg   = '';
    
    var makeList = accessDb.makeListDb;
    
    if (mydef.env.mcdkeep.place === 'fs') {
        makeList = accessFs.makeListFs;
    }

    makeList('', function(err, results) {
        if (err) {
            resultMsg = mydef.env.errmsg.makeList + ':' + err.message;
        }
        
        console.log(results);
        console.log('filelList length is ' + results.length);
    
        res.render('main', {
                title: '- List files -',
                files: results,
                uploadMsg: resultMsg,
            }
        );
    });
};