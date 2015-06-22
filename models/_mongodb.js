var mongoose = require('mongoose');

var fileInfoSchema = new mongoose.Schema({
    key: Number,
    dir: String,
    name: String,
    size: Number,
    entryDate:  Date,
    registrant: String,
    description: String,
    preview: Buffer,
    fileDataId: String,
},{collection: 'fileinfos'});

var fileInfoModel = mongoose.model('fileinfo', fileInfoSchema);


var fileDataSchema = new mongoose.Schema({
    fileInfoId: String,
    data: Buffer,
},{collection: 'filedatas'});

var fileDataModel = mongoose.model('filedata', fileDataSchema);


// connect
var connect = function() {
    // mongoDB　接続. 
    var conn_str = "";
    var vcapenv = process.env.VCAP_SERVICES;
    console.dir(vcapenv);
    
    if (vcapenv) {
        var mongoenv = JSON.parse(vcapenv);
        if (mongoenv['mongolab']) {
            var cred = mongoenv['mongolab'][0]['credentials'];
            if (cred.uri) {
                //conn_str = cred.url;
                conn_str = cred.uri;
            } else {
                console.log("No mongo db 2.4 found");
            }
        } else {
            conn_str = 'mongodb://localhost:27017';
            console.log('mongolab in mongoenv was not found.');
        }
    } else {
        conn_str = 'mongodb://localhost:27017';
    }
    console.log('conn_str is %s', conn_str);
    
    mongoose.connect(conn_str);
    
    // ドキュメント保存時にフックして処理したいこと
    fileInfoSchema.pre('save', function(next) {
        this.entryDate = new Date();
        next();
    });
    
    // モデル化: model('[登録名]', '定義したスキーマクラス')
    //mongoose.model('fileInfo', fileInfoSchema); 
    
    // connection
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    
    db.once('open', function() {
        console.log("Connected to  database");
    });
};


var ref = {
    schema: {
        fileInfo: fileInfoSchema,
        fileData: fileDataSchema,
    },
    model: {
        fileInfo: fileInfoModel,
        fileData: fileDataModel,
    },
    proc: {
        connect: connect,
    }
};

module.exports = ref;
