var express = require('express');
var router  = express.Router();
//var mongoose = require('mongoose');
var dbresource = require('../models/_mongodb');
var searchDb = require('../models/_searchdb');

//
// Select all name for auto-complete 
// (GET) /api/v1/name 
//
router.route('/v1/name').get(function(req, res) {
    
    console.log('(GET) /api/v1/name?term=hoge');
    
    var term = '';
    if (req.query !== undefined && req.query.term) term = req.query.term;
    
    console.log('(Check)(api/v1/name) term:\'' + term + '\'');
    
    var altParams = {};
    altParams.query = {};
    altParams.query.name = term;
    altParams.query.fields     = 'name';
    altParams.query.startPage  = 1;
    altParams.query.pageSize   = 10; // ok?
    // option 
    altParams.query.ignoreCase = true;
    altParams.query.nameIsWild = true;
    
    // set query parameters from request query parameters
    var qparams = searchDb.setQueryFileInfoFromReq(altParams);
    var results = [];
    
    // search
    searchDb.searchFileInfo(qparams, function(err, status, docs) {

        if (err) {
            console.log('err:' + err);
            return res.send(err);
        }
        
        for (var i = 0, size = docs.length; i < size; ++i) {
            var onerec = {};
            onerec.value = docs[i].name;
            onerec.label = docs[i].name;
            
            results.push(onerec);
        }
        
        var root = { results: results };
        console.log('(Check)(api/v1/name:');
        console.log(root);
        
        res.jsonp(root);   // use jsonp
    });
});


//
// Select all fileinfo record 
// (GET) /api/v1/fileinfo 
//
router.route('/v1/fileinfo').get(function(req, res) {
    
    console.log('(GET) /api/fileinfo');

    // set query parameters from request query parameters
    var qparams = searchDb.setQueryFileInfoFromReq(req);
    
    // search
    searchDb.searchFileInfo(qparams, function(err, status, docs) {

        if (err) {
            console.log('err:' + err);
            return res.send(err);
        }
        
        console.dir('docs:' + docs);
        
        res.json(docs);
    });
});


//
// Select all filedata record 
// (GET) /api/v1/filedata 
//
router.route('/v1/filedata').get(function(req, res) {
    
    console.log('(GET) /api/filedata');
    
    // (TODO) queryによる検索強化. 
    //   ?fields=name,dir, ... 
    //   ?pageNumber=1
    //   ?pageSize=10
    //   ?sort=name,entryDate, ... 
    var query = {};
    
    var fileDataModel = dbresource.model.fileData;
    fileDataModel.find(query, function(err, docs) {

        if (err) {
            console.log('err:' + err);
            return res.send(err);
        }
        //console.dir('docs:' + docs);
        var doc;
        for (var i = 0, size = docs.length; i < size; ++i) {
            doc = docs[i];
            doc.data = '(- snip -)';
        }
        res.json(docs);
    });
});


//
// Select fileinfo-record by _id
// (GET) /api/v1/fileinfo/(id) 
//
router.route('/v1/fileinfo/:id').get(function(req, res) {
    
    console.log('(GET) /api/fileinfo/(id)');

    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.findOne({ _id: req.params.id}, function(err, doc) {
        if (err) {
            return res.send(err);
        }
        
        res.json(doc);
    });
});


//
// Select filedata-record by _id
// (GET) /api/v1/filedata/(id) 
//
router.route('/v1/filedata/:id').get(function(req, res) {
    
    console.log('(GET) /api/filedata/(id)');

    var fileDataModel = dbresource.model.fileData;
    fileDataModel.findOne({ _id: req.params.id}, function(err, doc) {
        if (err) {
            return res.send(err);
        }
        // snip data becaule too long. 
        doc.data = '(- snip)';
        
        res.json(doc);
    });
});



//
// Create record 
// (POST) /api/v1/fileinfo + req.body
//
router.route('/v1/fileinfo').post(function(req, res) {

    console.log('(POST) /api/fileinfo & body');

    var fileInfoModel = dbresource.model.fileInfo;
    var doc = new fileInfoModel(req.body);
    
    doc.save(function(err) {
        if (err) {
            return res.send(err);
        }
        
        res.send({ message: 'fileInfo Added' });
    });
});

//
// Update record by _id
// (PUT) /api/v1/fileinfo/(id) 
//
router.route('/v1/fileinfo/:id').put(function(req,res){

    console.log('(PUT) /api/fileinfo/(id)');
    console.log('req.params.id:' + req.params.id);

    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.findOne({ _id: req.params.id }, function(err, doc) {
        if (err) {
            console.log('(err) ' + err);
            return res.send(err);
        }
        //console.dir('doc : ' + doc);
        console.dir('req.body :' + req.body);
        
        // console.log('req.body.length:' + req.body.length); // req.body dont have length
        
        var bodyprop, docprop;
        var matchCount = 0;
        
        for (bodyprop in req.body) {
            
            console.log('(Request) key:' + bodyprop + ' - value:' + req.body[bodyprop]);
            
            // If '_id' is exist, when occurs save. 
            if (bodyprop === '_id') continue;

            for (docprop in doc) {
                if (docprop === bodyprop) {
                    
                    console.log('(Valid property) key:' + docprop + ', value:' + doc[docprop]);
                    
                    doc[bodyprop] = req.body[bodyprop];
                    matchCount++;
                }
            }            
        }
        console.log('(Valid property) matchCount:' + matchCount);
        
        // save the movie
        if (matchCount) {
            
            doc.save(function(err) {
                if (err) {
                    return res.send(err);
                }
                
                //res.json(req.body);
                res.json({ message: 'fileInfo updated!' });
            });
        }
        else {
            res.json({ message: '（Err) Valid property is not found in the request.'});
        }
    });
});


//
// Delete record 
// (DELETE) /api/v1/fileinfo/(id) 
//
router.route('/v1/fileinfo/:id').delete(function(req, res) {

    console.log('(DELETE) /api/fileinfo/(id)');
    var message = '';

    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.remove({ _id: req.params.id}, function(err, doc) {
        if (err) {
            return res.send(err);
        }
        var fileDataModel = dbresource.model.fileData;
        fileDataModel.remove({ fileInfoId: req.params.id}, function(err, doc) {
            if (err) {
                return res.send(err);
            }
            res.json({ message: 'Successfully deleted' });
        });
    });
});

module.exports = router;
