var fs    = require('fs');
var path  = require('path');
var npng  = require('node-png').PNG;
var mydef = require('../models/_def');


//
// isLittleEndian
//
var isLittleEndian = function() {
    return  !!new Uint8Array(new Uint16Array([1]).buffer)[0];
}


//
// swapUShort
//
var swapUShort = function(num) {
    var bt = new Buffer(2);
    bt.writeUInt16LE(num, 0);
    return bt.readUInt16BE(0);
}


//
// swapUInt32
//
var swapUInt32 = function(num) {
    var bt = new Buffer(4);
    bt.writeUInt32LE(num, 0);
    return bt.readUInt32BE(0);
}


//
// ConvertUInt32Buf2Num
//
var ConvertUInt32Buf2Num = function(buf) {
    var offset = 0;
    if (arguments.length >= 2) {
        offset = Number(arguments[1]);
    }
    
    if (isLittleEndian()) {
        return buf.readUInt32LE(offset);
    } else {
        return buf.readUInt32BE(offset);
    }
};


//
// ConvertUInt32Num2Buf
//
var ConvertUInt32Num2Buf = function(num) {
    var buf = new Buffer(4);
    var offset = 0;
    if (arguments.length >= 2) {
        offset = Number(arguments[1]);
    }
    
    if (isLittleEndian()) {
        buf.writeUInt32LE(num, offset);
    } else {
        buf.writeUInt32BE(num, offset);
    }
    return buf;
};


// 
// getDwgSizAndByteSwapFlag (Cf. S_dwg_chkintel)
// 
var getDwgSizAndByteSwapFlag = function(/* Buffer */ code, callback ) {
    // callback is function(err, dwgsiz, byteSwapFlag)
    
    var chkbit = (code[0] & 0x80) >> 7;  // Get MSB of 0byte-data
    
    console.log('chkbit:' + chkbit);
    
    var dwgsiz = 0;
    var isSwap = true;
    
    if (isLittleEndian) {
        if (chkbit === 1) {
            isSwap = false;
        } else {
            isSwap = true;
        }
        dwgsize = code.readUInt32BE(0); // do byte-swap
    } else {
        if (chkbit === 1) {
            isSwap = true;
        } else {
            isSwap = false;
        }
        dwgsize = code.readUInt32LE(0); // dont byte-swap
    }
    dwgsize = dwgsize & 0x7fffffff;     // Erase MSB
    
    callback(null, dwgsize, isSwap);
};


//
// getSizeBlock
//
var getSizeBlock = function(fd, callback) {
    // callback is function(err, sizeblock, , byteSwapFlag)
    
    var sizeblock = {};
    var blkbuf = new Buffer(20);
    
    fs.read(fd, blkbuf, 0, 20, 0, function(err, bytesRead, buffer) {
        
        getDwgSizAndByteSwapFlag(blkbuf, function(err, dwgsiz, byteSwapFlag) {
            
            console.log('dwgsiz:' + dwgsiz);
            console.log('byteSwapFlag:' + byteSwapFlag);
            
            var dmnsiz = ConvertUInt32Buf2Num(blkbuf, 4);
            var mhdsiz = ConvertUInt32Buf2Num(blkbuf, 8);
            var mdtsiz = ConvertUInt32Buf2Num(blkbuf, 12);
            var aplsiz = ConvertUInt32Buf2Num(blkbuf, 16);
            /*
            console.log('dmnsiz:' + dmnsiz);
            console.log('mhdsiz:' + mhdsiz);
            console.log('mdtsiz:' + mdtsiz);
            console.log('aplsiz:' + aplsiz);
            */
            if (byteSwapFlag) {
                dmnsiz = swapUInt32(dmnsiz);
                mhdsiz = swapUInt32(mhdsiz);
                mdtsiz = swapUInt32(mdtsiz);
                aplsiz = swapUInt32(aplsiz);
            }
            /*
            console.log('dmnsiz:' + dmnsiz);
            console.log('mhdsiz:' + mhdsiz);
            console.log('mdtsiz:' + mdtsiz);
            console.log('aplsiz:' + aplsiz);
            */
            if (mhdsiz === 0)   mhdsiz = 1;
            if (mdtsiz === 0)   mdtsiz = 1;
            
            sizeblock.dwgsiz = dwgsiz;
            sizeblock.dmnsiz = dmnsiz;
            sizeblock.mhdsiz = mhdsiz;
            sizeblock.mdtsiz = mdtsiz;
            sizeblock.aplsiz = aplsiz;
            
            console.log('dwgsiz:' + sizeblock.dwgsiz);
            console.log('dmnsiz:' + sizeblock.dmnsiz);
            console.log('mhdsiz:' + sizeblock.mhdsiz);
            console.log('mdtsiz:' + sizeblock.mdtsiz);
            console.log('aplsiz:' + sizeblock.aplsiz);
            console.log('--- byteSwapFlag:' + byteSwapFlag);
            
            callback(null, sizeblock, byteSwapFlag);
        });
    });
};


//
// getAppDataById
//
var getAppDataById = function(fd, apid, callback) {
    // callback is function(err, apdata)
    
    getSizeBlock(fd, function(err, sizeblock, byteSwapFlag) {
        
        if (sizeblock.dmnsiz !== 400) {
            // This is not v3 drawing 
            return callback(new Error('Not v3 drawing'), null);
        }
        if (sizeblock.aplsiz <= 4 ) {
            // Not exist Appllication Data
            return callback(null, null);
        }
        
        var offset = 20 + sizeblock.dmnsiz + 4;   // SizeArea + DRMCM + MFREE
        if(sizeblock.mhdsiz > 0) {
            offset += ((sizeblock.mhdsiz - 1) * 4);   // Headder Area
        }
        if(sizeblock.mdtsiz > 0) {
            offset += ((sizeblock.mdtsiz - 1) * 4);   // Data    Area
        }
        console.log('offset: ' + offset);
        
        var intbuf = new Buffer(4);
        
        //fs.read(fd, buffer, bufferoffset, length, fileoffset, callback)
        fs.read(fd, intbuf, 0, 4, offset, function(err, bytesRead, buffer) {
            var applen = ConvertUInt32Buf2Num(intbuf);
            if (byteSwapFlag) applen = swapUInt32(applen);
            console.log('applen:' + applen);
            
            var apnum = (applen - 4) / (4 * 2);
            console.log('apnum:' + apnum);
            
            
            var apinfobuf = new Buffer(applen - 4);
            offset += 4;
            
            console.log('offset: ' + offset);
            
            fs.read(fd, apinfobuf, 0, (applen - 4), offset, function(err, bytesRead, buffer) {
                if (err) {
                    console.log('fs.read : ' + err);
                    return callback(err, null);
                }
                
                var skipLen = 0;
                var previewLen = 0;
                //for(var idx = 0 ; idx < applen - 4 ; idx++) {
                //    console.log(apinfobuf[idx]);
                //}
                for(var cnt = 0 ; cnt < apnum ; cnt++ ) {
                    var wklen  = ConvertUInt32Buf2Num(buffer, cnt * 8);
                    var wkid   = ConvertUInt32Buf2Num(buffer, cnt * 8 + 4);
                    
                    if(byteSwapFlag) {
                        wklen = swapUInt32(wklen);
                        wkid  = swapUInt32(wkid);
                    }
                    
                    console.log('cnt:' + cnt + ' - wklen:' + wklen + ', wkid:' + wkid);
                    
                    if (wkid === apid) {
                        previewLen = wklen;
                        break;
                    }
                    skipLen += wklen;
                }
                
                console.log('(Check)(_accessdwg/getAppDataById) previewLen:' + previewLen);
                
                if (previewLen === 0) {
                    // not found preview
                    console.log('(Check)(_accessdwg/getAppDataById) previewLen is 0. not found preview.');
                    return callback(null, null);    
                }
                
                var bytesMhd = bytesMhd = ((sizeblock.mhdsiz - 1) * 4); // mhdsize (word->byte)
                var bytesMdt = bytesMdt = ((sizeblock.mdtsiz - 1) * 4); // mdtsize (word->byte)
                var bytesAppLen = 4 + apnum  * ( 4 * 2 );              // APLLEN (byte)
                
                var previewOffset = 0;
                previewOffset  = 20 + sizeblock.dmnsiz + 4 + bytesMhd + bytesMdt + bytesAppLen;
                previewOffset += skipLen;           // Move top  at preview data
                
                console.log('previewoffset:' + previewOffset);
                
                var previewBuf = new Buffer(previewLen);
                
                //fs.read(fd, buffer, bufferoffset, length, fileoffset, callback)
                fs.read(fd, previewBuf, 0, previewLen, previewOffset, function(err, bytesRead, buffer) {
                    if (err) {
                        console.log('fs.read : ' + err);
                        return callback(err, null);
                    }
                    if (previewLen !== bytesRead) {
                        console.log('(Err) previewLen:' + previewLen + ' !== ' + bytesRead);
                        return callback(null, null);
                    }
                    callback(null, buffer);
                });
            });
        });
    });
}


// 
// getPreviewData
// 
var getPreviewData = function(targetPath, appId, callback) {
    // callback is function(err, color, pixel)
    
    fs.open(targetPath, 'r', function(err, fd) {
        if (err) {
            console.log('(Err) fs.open : ' + err);
            return callback(err, null, null);
        }
        
        getAppDataById (fd, appId, function(err, apdata) {
            if (err) {
                console.log('(Err)getAppDataById is fails... ' + err);
                return callback(err, null, null);
            }
            if (apdata === null) {
                console.log('Application data is not exist.');
                return callback(null, null, null);
            }
            
            //console.log('apdata:')
            //console.log(apdata);
            
            fs.close(fd, function() {
                console.log('Close file...');
            });
            
            var colorBuf = new Buffer(1056);
            
            for (var ct = 0; ct < 256; ct++ ) {
                colorBuf[ct * 4    ] = apdata[0x23 + ct * 4 + 1];  // Red
                colorBuf[ct * 4 + 1] = apdata[0x23 + ct * 4 + 2];  // Green
                colorBuf[ct * 4 + 2] = apdata[0x23 + ct * 4 + 3];  // Blue
                colorBuf[ct * 4 + 3] = apdata[0x23 + ct * 4 + 0];  // Auxiliary
            }
            
            callback(null, colorBuf, apdata.slice(0x423));
        });
    });
};


// 
// getPngFromPreview
// 
var getPngFromPreview = function(previewColor, previewPixel, templatePngPath, callback) {
    
    // callback is function(err, pngdata)
    
    var nWidth  = 150;
    var nHeight = 150;
    
    fs.createReadStream(templatePngPath)
        .pipe(new npng({
            filterType: 4
        }))
        .on('parsed', function() {
            if (this.height !== nHeight || this.width !== nWidth) {
                console.log('(Err) This template png is not 150x150 pixels.');
                return callback();
            }
            
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var idx = (this.width * y + x) << 2;
                    
                    // and reduce opacity 
                    this.data[idx+3] = 255; //this.data[idx+3] >> 1;
                    
                    this.data[idx  ] = previewColor[previewPixel[x + y * nHeight]    ];
                    this.data[idx+1] = previewColor[previewPixel[x + y * nHeight] + 1];
                    this.data[idx+2] = previewColor[previewPixel[x + y * nHeight] + 2];
                }
            }
            
            // check!
            //this.pack().pipe(fs.createWriteStream('out.png'));
            
            this.pack();
            
            var chunks = [];
            
            this.on('data', function(chunk) {
                chunks.push(chunk);
                console.log('chunk:', chunk.length);
            });
            this.on('end', function() {
                var result = Buffer.concat(chunks);
                
                console.log('final result:', result.length);
                
                callback(null, result.toString('base64')); 
            });
        });
};


// 
// getPreviewBase64FromMcd
//
var getPreviewBase64FromMcd = function(mcdPath, callback) {
    // callback is err, pngdata
    
    var previewId = 20000;
    var templatePngPath = path.join(path.join(mydef.env.dir.root, mydef.env.dir.image), mydef.env.name.orgPng);

    console.log('(Check)(_accessdwg/getPreviewBase64FromMcd) templatePngPath:' + templatePngPath);
    
    // get preview data(color and pixel) from mcd-file 
    getPreviewData(mcdPath, previewId, function(err, color, pixel) {
        if (err) {
            console.log('(Err)(_accessdwg/getPreviewBase64FromMcd) getPreviewData fails ... :' + err);
            return callback(err, null);
        }
        
        console.log('color:');
        console.log(color);
        
        console.log('pixel:');
        console.log(pixel);
        
        if (color && pixel) {
            
            console.log('(Check) color && pixel');
            
            // get png data(Base64) from template png file and preview data(color and pixel)
            getPngFromPreview(color, pixel, templatePngPath, function(err, pngdata) {
                if (err) {
                    console.log('(Err) getPngFromPreview fails... : ' + err);
                    return callback(err, null);
                }
                
                console.log('pngdata:');
                console.log(pngdata);
                
                callback(null, pngdata);
            });
        }
        else {
            console.log('(Check) color or pixel is null.');
            callback(null, null);
        }
    });
};

module.exports.getPreviewBase64FromMcd = getPreviewBase64FromMcd;

