var express = require('express');
var router  = express.Router();
//var mongoose = require('mongoose');
var dbresource = require('../models/_mongodb');


//
// Select all fileinfo record 
// (GET) /api/fileinfo 
//
router.route('/fileinfo').get(function(req, res) {
    
    console.log('(GET) /api/fileinfo');

    var fileInfoModel = dbresource.model.fileInfo;
    fileInfoModel.find({}, function(err, docs) {

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
// (GET) /api/filedata 
//
router.route('/filedata').get(function(req, res) {
    
    console.log('(GET) /api/filedata');

    var fileDataModel = dbresource.model.fileData;
    fileDataModel.find({}, function(err, docs) {

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
// (GET) /api/fileinfo/(id) 
//
router.route('/fileinfo/:id').get(function(req, res) {
    
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
// (GET) /api/filedata/(id) 
//
router.route('/filedata/:id').get(function(req, res) {
    
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
// (POST) /api/fileinfo + req.body
//
router.route('/fileinfo').post(function(req, res) {

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
// (PUT) /api/fileinfo/(id) 
//
router.route('/fileinfo/:id').put(function(req,res){

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
// (DELETE) /api/fileinfo/(id) 
//
router.route('/fileinfo/:id').delete(function(req, res) {

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
