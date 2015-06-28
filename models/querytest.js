var dbresource = require('../models/_mongodb');
var searchDb = require('../models/_searchdb');


// main

// DB�ڑ�
dbresource.proc.connect();


setTimeout(function() {
    
    // Test Data
    var req = {};
    req.query = {};
    req.query.dir        = '*';
    req.query.name       = 'ov*.*';
    req.query.fields     = 'name, dir, size';     // ?fields=name,dir, ... 
    req.query.sort       = 'asc.name, desc.siz, description';      // ?sort=asc.name,entryDate, ... 
    req.query.pageSize   = '2';
    req.query.startPage  = '2';
    
    
    // set query parameters from request query parameters
    var qparams = searchDb.setQueryFileInfoFromReq(req);
    
    // search
    searchDb.searchFileInfo(qparams, function(err, status, docs) {
        if (err) {
            console.log('(Err)searchFileInfo :' + err);
            return;
        }
        
        console.log('docs:');
        console.log(docs);
        
        console.log('status:');
        console.log(status);
    });
    
    return;
    
}, 4000);

