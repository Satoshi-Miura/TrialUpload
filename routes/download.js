//var fs    = require('fs');
var path  = require('path');
//var mime  = require('mime');
var mydef = require('../models/_def');


exports.get = function(req, res) {
    
    // http://stackoverflow.com/questions/7288814/download-a-file-from-nodejs-server-using-express
    //console.dir(req.params);
    console.dir(req.params.id);
    
    var target_dir  = path.join(mydef.env.dir.root, mydef.env.dir.storefile);
    var target_path = path.join(target_dir, req.params.id); 
    console.log('target_path is %s', target_path);
    

    // (方法1)
    //var file = fs.readFileSync(target_path, 'binary');
    //res.setHeader('Content-Length', file.length);
    //res.write(file, 'binary');
    //res.end();  

    // (方法2)
    //var mimetype = mime.lookup(target_path);
    //console.log('mimetype is %s', mimetype);
    //res.setHeader('Content-type'  , mimetype);
    //
    //var downFile = fs.createReadStream(target_path);
    //downFile.pipe(res);

　　　// (方法3)
    res.download(target_path, path.basename(target_path), function(err){
        if (err) {
            console.log('(Error)download is fails... ' + err); 
            return;
        } else {
            // decrement a download credit, etc.
        }
    });

    // err?
    res.on('error', function (err) {
        console.log('(Error)download is fails... ' + err); 
        return;
    });
};
