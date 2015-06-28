
// 
// file upload
// 
function uploadFiles(files) {
    
    var fd = new FormData();
    
    // get the number of file
    var filesLength = files.length;
    
    for (var i = 0; i < filesLength; i++) {
        fd.append("thumbnail", files[i]);
    }
    
    // use Ajax
    $.ajax({
        url: '/uploads',
        type: 'POST',
        data: fd,
        processData: false,
        contentType: false,
        success: function(data) {
            console.log('ファイルがアップロードされました。 data:' + data);
            // (TODO) dataに入っていないケース(Previewがないmcdアップ時)がある. 
            if (data === '') data = 'ファイルがアップロードされました。';
            
            //document.getElementById('uploadmsg').innerHTML= data;
            $('#uploadmsg').html(data);
            setTimeout(function() {
                $('#uploadmsg').html('');
            }, 5000);
        },
        error: function(xhr, textStatus, errorThrown) {
            console.log('(Err) ajax - error');
            console.log('xhr:' + xhr);
            console.log('textStatus:' + textStatus);
            console.log('errorThrown:' + errorThrown);
            // TODO - Server側のエラーメッセージを拾う. 
            alert('Error! ' + textStatus + ' ' + errorThrown);
            $('#uploadmsg').html('Error!');
        }
    });
}


// 
// div#drophere
// 
$(function(){
    
    // 
    //  drop the file
    // 
    $('#drophere').bind('drop', function(e){
        // stop default proc.
        e.preventDefault();
        
        // get upload file info
        var files = e.originalEvent.dataTransfer.files;
        
        uploadFiles(files);
        
    }).bind('dragenter', function(){
        // stop default proc.
        return false;
    }).bind('dragover', function(){
        // stop default proc.
        return false;
    });
    
    // 
    // push 'Select file' button(dummy)
    // 
    $('#uploadbtn').click(function() {
        // Relate dummy button and input[type="file"]
        $('input[type="file"]').click();
    });
    
    $('input[type="file"]').change(function(){
        // get file info.
        var files = this.files;
        
        uploadFiles(files);
    });
    
});


// 
// input#searchName
// 
$(function() {
    // 
    // auto complete for search-name inputbox
    // 
    $('#searchName').autocomplete({
        source: function( req, res ) {
            $.ajax({
                url: '/api/v1/name',
                dataType: "jsonp",
                data: {
                    featureClass: 'P',
                    style: 'full',
                    maxRows: 12,
                    term: req.term,
                },
                success: function( data ) {
                    console.log(data);
                    res( $.map( data.results, function( item ) {
                        console.log(item);
                        return {
                            label: item.value,
                            value: item.label
                        }
                    }));
                },
                error: function( err ) {
                    alert('error');
                    console.log(err);
                },
            });
        },
        select: function(event, ui) {
            
            console.log('select:');
            
            var originalEvent = event;
            console.log(event);
            while (originalEvent) {
                if (originalEvent.keyCode == 13) {
                    originalEvent.stopPropagation();
                }
                if (originalEvent == event.originalEvent) {
                    break;
                }
                originalEvent = event.originalEvent;
            }
        },
        autoFocus: true,
        delay: 500,
        minLength: 2
    });
});


// 
// input#searcName
// 
$(function() {
    // 
    // auto complete for search-name inputbox
    // 
    $('#searchName').keydown(function (e) {
        if(e.keyCode == 13) {
            
            var strName = $("#searchName").val();
            $("#log").append($("<li />").text("Enter key detected. text is " + strName));
            //alert('keydown 13');
            
            // don't accept if no input
            if(strName.length > 0) {
                
                // (TODO) add parameters (startPage, pageSize, sort)
                var jumpHref = "/listfile?name=" + encodeURIComponent(strName);
                console.log('jumpHref:' + jumpHref);
                window.location.href = jumpHref;
            }
            e.preventDefault();
        }
    });
});


// 以下は 将来 消す. 
/*
    function handleFileSelect(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      
      var files = evt.dataTransfer.files; // FileList object.
      var postUrl = 'https://trialupload.mybluemix.net/upload';
      
      // (TODO) filesのvalueにはファイル名が入っているが、ディレクトリが含まれていない! よってFileNotFoundになる. 
      // (TODO) 以下のfor文もWebIDE上ではエラー扱いだが Firefox上では問題ない. 
      for (var i = 0, f; f = files[i]; i++) {
          FileUpload(postUrl, f); 
          // cf. https://developer.mozilla.org/ja/docs/Using_files_from_web_applications
      }
      
      // files is a FileList of File objects. List some properties.
      //for (var i = 0, f; f = files[i]; i++) {
      //   alert('ファイルがドラッグされました。 (' + f.name + ')');
      //}
    }
    
    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }
    
    // Chrome/Safari��sendAsBinaryを!
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
        function byteValue(x) {
            return x.charCodeAt(0) & 0xff;
        }
        var ords = Array.prototype.map.call(datastr, byteValue);
        var ui8a = new Uint8Array(ords);
        this.send(ui8a.buffer);
    };
    
    function FileUpload(url, file) {
        
        var reader = new FileReader();  
        var xhr = new XMLHttpRequest();
        this.xhr = xhr;
        
        alert(file.name + ' をアップロードします。');
        
        //var self = this;
        this.xhr.upload.addEventListener("progress", function(e) {
            if (e.lengthComputable) {
                var percentage = Math.round((e.loaded * 100) / e.total);
                //self.ctrl.update(percentage);
            }
        }, false);
        
        xhr.upload.addEventListener("load", function(e){
            //self.ctrl.update(100);
            //var canvas = self.ctrl.ctx.canvas;
            //canvas.parentNode.removeChild(canvas);
        }, false);
        
        xhr.open("POST", url);
        //xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
        
        reader.onload = function(evt) {
            xhr.sendAsBinary(evt.target.result);
        };
        
        reader.readAsBinaryString(file);
    }
*/
