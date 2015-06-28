var path     = require('path');
var mydef    = require('../models/_def');
var dbresource = require('../models/_mongodb');

exports.get = function(req, res) {
    
    console.log('(Check)(svg/get) id:' + req.params.id );
    
    var fileInfoModel = dbresource.model.fileInfo;
    var msg = '';
    var fileinfo;
    
    fileInfoModel.findOne({ _id: req.params.id}, function(err, doc) {
        if (err) {
            msg = err.description;
        }
        else {
            var downloadDir = mydef.env.url.downloads; // dont use doc.dir
            
            fileinfo = {
                filename:    doc.name, 
                url:         path.join(downloadDir, doc.name),
                svg:         doc.svg,
            };
            
            console.log('(Check)(svg/get) filename:' + doc.name);
            console.log('(Check)(svg/get) url:' + path.join(downloadDir, doc.name));
            console.log('(Check)(svg/get) svg:');
            console.log(doc.svg);
            
            if(!doc.svg) { 
                fileinfo = null;
                msg = mydef.env.errmsg.noEntrySvg;
            }
        }
        
        res.render('svgview', {
                title: 'Express - svgview',
                file: fileinfo,
                msg: msg,
            }
        );
    });
    
};
