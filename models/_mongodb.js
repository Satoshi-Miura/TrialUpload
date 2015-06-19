var mongoose = require('mongoose');

var FileInfoSchema = new mongoose.Schema({
    key: Number,
    dir: String,
    name: String,
    size: Number,
    entryDate:  Date,
    registrant: String,
    description: String,
    preview: Buffer,
},{collection: 'fileinfos'});

var FileInfoModel = mongoose.model('fileinfo', FileInfoSchema);
module.exports.schema = FileInfoSchema;
module.exports.model  = FileInfoModel;
