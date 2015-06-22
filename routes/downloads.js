//var fs    = require('fs');
var path  = require('path');
var mime  = require('mime');
var mydef = require('../models/_def');
var accessDb = require('../models/_accessdb');


// Get /downloads/xxx.mcd
exports.get = function(req, res) {
    
    // http://stackoverflow.com/questions/7288814/download-a-file-from-nodejs-server-using-express
    //console.dir(req.params);
    console.log('(Check)(downloads) url:' + req.params.id); // xxx.mcd
    
    if (mydef.env.mcdkeep.place === 'db') {
        var dir  = '*';
        var name = req.params.id;
        
        console.log('(Check)(downloads/get) dir  :' + dir);
        console.log('(Check)(downloads/get) name :' + name);
        
        //var mimetype = mime.lookup(name);
        //console.log('mimetype is %s', mimetype);
        //res.setHeader('Content-type'  , mimetype);
        
        accessDb.readFileDb(res, dir, name, function(err, targetPath) {
            if (err) {
                console.log('(Err)(downloads/get) readFileDb is fails... Err:' + err.message); 
            }
            
            console.log('(Check)(downloads) targetPath:' + targetPath);
            
            res.download(targetPath, path.basename(targetPath), function(err){
                if (err) {
                    console.log('(Error)download is fails... ' + err); 
                    return;
                } else {
                    // decrement a download credit, etc.
                }
            });
        });
    }
    else { // 'fs'
        var targetPath = path.join(path.join(mydef.env.dir.root, mydef.env.dir.storefile), req.params.id); 
        
        // (方法1)
        //var file = fs.readFileSync(targetPath, 'binary');
        //res.setHeader('Content-Length', file.length);
        //res.write(file, 'binary');
        //res.end();  
        
        // (方法2)
        //var mimetype = mime.lookup(targetPath);
        //console.log('mimetype is %s', mimetype);
        //res.setHeader('Content-type'  , mimetype);
        //
        //var downFile = fs.createReadStream(targetPath);
        //downFile.pipe(res);
        
    　　　// (方法3)
        res.download(targetPath, path.basename(targetPath), function(err){
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
    } // mydef.env.mcdkeep.place === 'db'
};
