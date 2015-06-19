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
