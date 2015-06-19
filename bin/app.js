
var express    = require('express');
var app = express();

//var fs = require('fs');
var path       = require('path');
var bodyParser = require('body-parser');
var multer     = require('multer');
var mongoose   = require('mongoose');
var mydef      = require('../models/_def');

console.log('(Check)(app) Current directory: ' + process.cwd());
// パス指定
mydef.env.dir.root = process.cwd();

// mongoDB　接続. 
var conn_str = "";
var vcapenv = process.env.VCAP_SERVICES;
console.dir(vcapenv);

if (vcapenv) {
    var mongoenv = JSON.parse(vcapenv);
    //if (mongoenv['mongodb-2.4']) {
    if (mongoenv['mongolab']) {
        //var cred = mongoenv['mongodb-2.4'][0]['credentials'];
        var cred = mongoenv['mongolab'][0]['credentials'];
        //if (cred.url) {
        if (cred.uri) {
            //conn_str = cred.url;
            conn_str = cred.uri;
        } else {
            console.log("No mongo db 2.4 found");
        }
    } else {
        conn_str = 'mongodb://localhost:27017';
        console.log('mongodb-2.4 in mongoenv was not found.');
    }
} else {
    conn_str = 'mongodb://localhost:27017';
}
console.log('conn_str is %s', conn_str);

mongoose.connect(conn_str);

// ドキュメント保存時にフックして処理したいこと
var fileInfoSchema = require('../models/_mongodb').schema;
fileInfoSchema.pre('save', function(next) {
    this.entryDate = new Date();
    next();
});

// モデル化: model('[登録名]', '定義したスキーマクラス')
mongoose.model('FileInfo', fileInfoSchema); 
 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("Connected to  database");
});
  
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
    index   : require('../routes/index'),
    upload  : require('../routes/upload'),
    listfile: require('../routes/listfile'),
    download: require('../routes/download'),
};

app.get('/', routes.index.index);
app.post('/upload', routes.upload.post);
app.get('/listfile', routes.listfile.listfile);
app.get('/download/:id', routes.download.get);

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
