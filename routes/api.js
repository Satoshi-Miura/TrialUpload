var express = require('express');
var router  = express.Router();
//var mongoose = require('mongoose');
var FileInfoModel = require('../models/_mongodb').model;

//
// Select all record 
// (GET) /api/fileinfo 
//
router.route('/fileinfo').get(function(req, res) {
    
    console.log('(GET) /api/fileinfo');

    FileInfoModel.find({}, function(err, docs) {

        if (err) {
            console.log('err:' + err);
            return res.send(err);
        }
        console.dir('docs:' + docs);
        
        res.json(docs);
    });
});

//
// Select record by _id
// (GET) /api/fileinfo/(id) 
//
router.route('/fileinfo/:id').get(function(req, res) {
    
    console.log('(GET) /api/fileinfo/(id)');

    FileInfoModel.findOne({ _id: req.params.id}, function(err, doc) {
        if (err) {
            return res.send(err);
        }
        
        res.json(doc);
    });
});

//
// Create record 
// (POST) /api/fileinfo + req.body
//
router.route('/fileinfo').post(function(req, res) {

    console.log('(POST) /api/fileinfo & body');

    var doc = new FileInfoModel(req.body);
    
    doc.save(function(err) {
        if (err) {
            return res.send(err);
        }
        
        res.send({ message: 'FileInfo Added' });
    });
});

//
// Update record by _id
// (PUT) /api/fileinfo/(id) 
//
router.route('/fileinfo/:id').put(function(req,res){

    console.log('(PUT) /api/fileinfo/(id)');
    console.log('req.params.id:' + req.params.id);

    FileInfoModel.findOne({ _id: req.params.id }, function(err, doc) {
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
                res.json({ message: 'FileInfo updated!' });
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

    FileInfoModel.remove({
        _id: req.params.id
    }, function(err, movie) {
        if (err) {
            return res.send(err);
        }
        
        res.json({ message: 'Successfully deleted' });
    });
});

module.exports = router;
