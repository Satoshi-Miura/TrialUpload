var path  = require('path');
var clone = require('clone');
var mydef = require('../models/_def');
var dbresource = require('../models/_mongodb');


// 
// convertWild2Regex
// 
var convertWild2Regex = function(wc) {
    var reg = wc;
    // keep the below-mentioned order
    reg = reg.replace(/\./g, '\\.');
    reg = reg.replace(/\?/g, '.'  );
    reg = reg.replace(/\*/g, '.*' );
    return reg;
};


// 
// setCondSearch
// (req.query)
//   . name=ov*
//   . dir =root
//   . ignoreCase=
//   . nameIsWild=
//
var setCondSearch = function(req, qparams) {
    
    if (qparams.condSearch === undefined) {
        console.log('(Err) Invalid paramQueryFileInfo');
        return;
    }
    
    if (req.query.name || req.query.name) {
        // condSearch - search condition
        //  (in)   ?name=OV*.MCD&dir=root
        //  (proc) req.query.name='OV*.MCD' , req.query.dir='*'
        //  (out)  {name: /OV.*\\.MCD/ , dir: 'root'}
        var condSearch = {};
        if (req.query.name) {
            
            var isIgnoreCase = false;
            var isNameWild   = false;
            if (req.query.ignoreCase) isIgnoreCase = true;
            if (req.query.nameIsWild) isNameWild   = true;        
            
            if (isNameWild || req.query.name.indexOf('*') !== (-1) || req.query.name.indexOf('?') !== (-1)) {
                if (isIgnoreCase) {
                    condSearch.name = new RegExp(convertWild2Regex(req.query.name), 'i');
                } else {
                    condSearch.name = new RegExp(convertWild2Regex(req.query.name));
                }
            } else if (req.query.name.length) {
                condSearch.name = req.query.name;
            }
        }
        if (req.query.dir) {
            if (req.query.dir.indexOf('*') !== (-1) || req.query.dir.indexOf('?') !== (-1)) {
                // none
            } else if (req.query.dir.length) {
                condSearch.dir = req.query.dir;
            }
        }
        console.log('(Check)(_search/setCondSearch)');
        console.log(condSearch);
        
        // set
        qparams.condSearch = condSearch;
    }
};


// 
// setCondField
// (req.query)
//   . fields=(item),(item), ...
// 
var setCondField = function(req, qparams) {
    
    if (qparams.condField === undefined) {
        console.log('(Err) Invalid paramQueryFileInfo');
        return;
    }
    
    if (req.query.fields) {
        // condField - select fields
        //  (in)   ?fields=name,dir,size
        //  (proc) req.query.fields='name,dir, size'
        //  (out)  {name: 1, dir: 1, size:1}
        var condField   = {};
        
        var af  = req.query.fields.split(',');
        
        for (var i in af) {
            condField[af[i].trim()] = 1;
        }
        console.log('(Check)(_search/setCondField)');
        console.log(condField);
        
        // set
        qparams.condField = condField;
    }
};


// 
// setCondSort
// (req.query)
//   . sort=desc.name, asc.entryDate,...
// 
var setCondSort = function(req, qparams) {
    
    if (qparams.condSort === undefined) {
        console.log('(Err) Invalid paramQueryFileInfo');
        return;
    }
    
    if (req.query.sort) {
        // condSort - sort
        //  (in)   ?sort=desc.name, description
        //  (proc) req.query.sort='desc.name, description'
        //  (out)  {name: 'desc', description:1 'asc'}
        var condSort = {};
        
        var as = req.query.sort.split(',');
        
        for (var i in as) {
            // asc.name -> name: 'asc' , desc.name -> name: 'desc'
            var item = as[i].trim();
            var ckAsc  = item.indexOf('asc.');
            var ckDesc = item.indexOf('desc.');
            //console.log('ckDesc:' + ckDesc);
            if (ckAsc !== (-1)) {
                condSort[as[i].trim().slice(4)] = 'asc';
            }
            else if (ckDesc !== (-1)) {
                condSort[as[i].trim().slice(5)] = 'desc';
            }
            else {
                condSort[as[i].trim()] = 'asc'; // default is asc
            }
        }
        console.log('(Check)(_search/setCondSort)');
        console.log(condSort);
        
        // set
        qparams.condSort = condSort;
    }
    else { // debug (TODO)FIXME
        qparams.condSort = { name : 'asc' };
    }
};


// 
// setCondLimit
// (req.query)
//   . pageSize=10 (10 records per page)
// 
var setCondLimit = function(req, qparams) {
    
    if (qparams.condLimit === undefined) {
        console.log('(Err) Invalid paramQueryFileInfo');
        return;
    }
    
    if (req.query.pageSize) {
        // condLimit - limit documents
        //  (in)   ?pageSize=10
        //  (proc) req.query.pageSize='10'
        //  (out)  10
        // 
        var numItemPerPage = mydef.env.list.defaultPageSize; // default
        
        var condLimit = (-1);
        
        var wkSize = Number(req.query.pageSize);
        if ((wkSize > 0) && (wkSize < mydef.env.list.maxPageSize)) {
            numItemPerPage = wkSize;
        }
        
        condLimit = numItemPerPage;
        
        console.log('(Check)(_search/setCondLimit) condLimit:' + condLimit);
        
        // set
        qparams.condLimit = condLimit;
    }
};


// 
// setCondSkip
// (req.query)
//   . startPage=1 (default is 1)
// 
var setCondSkip = function(req, qparams, pageSize) {
    
    if (qparams.condSkip === undefined) {
        console.log('(Err) Invalid paramQueryFileInfo');
        return;
    }
    
    if (qparams.condLimit === (-1)) {
        qparams.condLimit = pageSize;
    }
    
    if (req.query.startPage) {
        
        // condSkip - skip documents (unit: page)
        //  (in)   ?startPage=2
        //  (proc) req.query.startPage='2'
        //  (out)  10 (if pageSize is 10)
        //  (referece) startPage
        var condSkip   = (-1);
        
        var startPage = Number(req.query.startPage);
        if (startPage === 0)  startPage = 1;
        
        var skipNum = (startPage - 1) * pageSize;
        if (skipNum) {
            condSkip = skipNum;
        }
        
        console.log('(Check)(_search/setCondSkip) condSkip:' + condSkip);
        console.log('condSkip:' + condSkip);
        
        // set
        qparams.condSkip = condSkip;
    }
};


// 
// set req-query into fileinfo-query-params
//
var setQueryFileInfoFromReq = function(req) {
    
    var qparams = clone(mydef.param.queryFileInfo);
    
    setCondSearch(req, qparams);
    
    setCondField(req, qparams);
    
    setCondSort(req, qparams);
    
    setCondLimit(req, qparams);
    
    var pageSize = qparams.condLimit;
    if (pageSize === (-1)) {
        pageSize = mydef.env.list.defaultPageSize;
    }
    setCondSkip(req, qparams, pageSize);
    
    console.log('(Check)(_search/setQueryFileInfoFromReq)');
    console.log(qparams);

    return qparams;
};


// 
// searchFileInfo
//
var searchFileInfo = function(qparams, callback) {
    // callback is function(err, status, docs)
    // status is {total:27, startPage:2, pageSize:10}
    
    if (qparams.condSearch === undefined) {
        returncallback(new Error('Invalid paramQueryFileInfo'), null, null);
    }
    
    var status = {};
    status['total'] = 0;
    var pageSize  = qparams.condLimit;
    if (pageSize === (-1)) {
        pageSize = mydef.env.list.defaultPageSize;
    }
    status['pageSize'] = pageSize;
    var startPage = Math.floor(qparams.condSkip / pageSize) + 1;
    if (startPage <= 0) {
        startPage = 1;
    }
    status['startPage'] = startPage;
    
    console.log('(Check)(_searchdb/searchFileInfo) #1 - status:');
    console.log(status); 
    
    // 
    // create query
    // 
    
    // 1. condSearch
    var docQuery = dbresource.model.fileInfo.where(qparams.condSearch);
    var cntQuery = dbresource.model.fileInfo.where(qparams.condSearch);
    console.log('(Check)(_searchdb/searchInfo) query.where:' + qparams.condSearch);
    
    // 2. condField
    if (Object.keys(qparams.condField).length) {
        docQuery = docQuery.select(qparams.condField);
        console.log('(Check)(_searchdb/searchInfo) query.select:' + qparams.condField);
    }
    
    // 3. condSort
    if (Object.keys(qparams.condSort).length)  {
        docQuery = docQuery.sort(qparams.condSort);
        console.log('(Check)(_searchdb/searchInfo) query.sort:' + qparams.condSort);
    }
    
    // 4. condSkip
    if (qparams.condSkip !== (-1))  {
        docQuery = docQuery.skip(qparams.condSkip);
        console.log('(Check)(_searchdb/searchInfo) query.skip:' + qparams.condSkip);
    }
    
    // 5. condLimit
    if (qparams.condLimit !== (-1)) {
        docQuery = docQuery.limit(qparams.condLimit);
        console.log('(Check)(_searchdb/searchInfo) query.limit:' + qparams.condLimit);
    }
    
    // Get total-count(/wo skip&limit)
    cntQuery.count(function(err, count) {
        if (err) {
            console.log('(Check)(_searchdb/searchInfo) query.count: ' + err);
        }
        
        status.total = count;
        
        console.log('(Check)(_searchdb/searchFileInfo) #2 - status:');
        console.log(status);
        
        // get documents
        docQuery.exec(function(err, docs) {
            if (err) {
                console.log('(Check)(_searchdb/searchInfo) queryexec fails... :' + err);
                callback(err, status, null);
            }
            
            callback(null, status, docs);
        });
        
    });
};


// 
// makeListDb
// 
var makeListDb = function(req, callback) {
    // callback is function(err, status, results)
    // status is {total:27, startPage:2, pageSize:10}

    console.log('(Check)(_searchdb/makeListDb)start makeListDB ... ');
    
    var results = [];
    
    // set query parameters from request query parameters
    var qparams = setQueryFileInfoFromReq(req);
    
    // search
    searchFileInfo(qparams, function(err, status, docs) {
    
        if (err) {
            console.log('find occurs err:' + err);
            return callback(err, status, results);
        }
        
        var doc;
        for (var i = 0, size = docs.length; i < size; ++i) {
            doc = docs[i];
            
            console.log('_id        :' + doc._id);
            //console.log('dir        :' + doc.dir );
            console.log('name       :' + doc.name );
            //console.log('size       :' + doc.size );
            //console.log('entryDate  :' + doc.entryDate );
            
            var downloadDir = mydef.env.url.downloads; // dont use doc.dir
            var onerec = {
                    filename:    doc.name, 
                    url:         path.join(downloadDir, doc.name), 
                    size:        doc.size,
                    entrydate:   doc.entryDate,
                    registrant:  doc.registrant,
                    description: doc.description,
                    preview:     doc.preview,
                    svgurl:      mydef.env.url.svg + '/' + doc._id,
            };
            
            if (doc.preview === undefined || doc.preview.length === 0) {
                // use alternative png
                mydef.getAltPng(function(previewData) {
                    onerec.preview = previewData;
                    console.log('eet pooldata(mydef.getAltPng)');
                    //console.dir(previewData);
                });
                
            }
            results.push(onerec);
            
            console.log('(Check)(_searchdb/makeListDb)results.length:' + results.length);
        } // docs - loop
        
        callback(null, status, results);
    });
};


module.exports.setQueryFileInfoFromReq = setQueryFileInfoFromReq;
module.exports.searchFileInfo = searchFileInfo;
module.exports.makeListDb     = makeListDb;
