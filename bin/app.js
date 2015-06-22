
var express    = require('express');
var app = express();

//var fs = require('fs');
var path       = require('path');
var bodyParser = require('body-parser');
var multer     = require('multer');
//var mongoose   = require('mongoose');
var mydef      = require('../models/_def');
var dbresource = require('../models/_mongodb');


console.log('(Check)(app) Current directory: ' + process.cwd());
// パス指定
mydef.env.dir.root = process.cwd();

// DB接続
dbresource.proc.connect();

// View engine
app.set('view engine', 'jade');
//app.set('views', __dirname + '/views'); // app.jsを/から/binに移動したため変更. 
app.set('views', path.join(mydef.env.dir.root, 'views'));

// default
//app.use(express.static(__dirname + '/public')); // app.jsを/から/binに移動したため変更. 
app.use(express.static(path.join(mydef.env.dir.root, 'public')));

// for upload
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());  // raw, text は効果なし? 

// (TODO) limit指定で filesizeを4Mbytesまでに(mongoDB格納上限), 
// (TODO) rename指定で upload.jsでのリネーム処理をなくす. 
// (TODO) InMemory指定onにしてfsを介さず直接bufferからBASE64化する. 
app.use(multer({ dest: path.join(mydef.env.dir.root, mydef.env.dir.storefile)}));

// route
var routes = {
    index    : require('../routes/index'),
    uploads  : require('../routes/' + mydef.env.url.uploads),
    listfile : require('../routes/listfile'),
    downloads: require('../routes/' + mydef.env.url.downloads),
};

app.get('/', routes.index.index);
app.post('/' + mydef.env.url.uploads, routes.uploads.post);
app.get('/listfile', routes.listfile.listfile);
app.get('/' + mydef.env.url.downloads + '/:id', routes.downloads.get);

app.use ('/api', require('../routes/api'));

// prepare default png-data
mydef.getAltPng(function(previewData) {
    console.log('mydef.getAltPng');
    console.dir(previewData);
});

// listen
var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Server running on port %d', server.address().port);
    
});
