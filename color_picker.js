var target_image_size = 600;

$(function(){
   // パレットの幅同期
   var palettes = $(".palette");
   var palette = $(".palette:first");
   var width = Number(palette.css("width").replace("px",""));   
   var height = Number(palette.css("height").replace("px",""));  
   var margin = Number(palette.css("margin-left").replace("px",""));  
   if(window.sessionStorage){
      var w = sessionStorage.getItem("width");
      var h = sessionStorage.getItem("height");
      var m = sessionStorage.getItem("margin");
      width = (w)? w : width;
      height = (h)? h : height;
      margin = (m)? m : margin;
   }
   $("#palette_width").val(width);
   $("#palette_height").val(height);
   $("#palette_margin").val(margin);
   changeParamater();
   $("#palette_width").change(changeParamater);
   $("#palette_height").change(changeParamater);
   $("#palette_margin").change(changeParamater);
   // 16進数変換
   var toHex = function(v){
      return v < 16 ? '0' + v.toString(16) : v.toString(16);
   };
   // 選択中のパレット
   var target_palette;
   // イメージファイル読込
   $('#imgfile').change(imageLoad);
   // イメージファイル再読み込み
   $(".reload").mouseup(imageLoad);
   // パレット選択
   palettes.mouseup(function(e){
      palettes.map(function(){
         $(this).css("border-color", "rgba(0,0,0,0)");
      });
      $(this).css("border-color", "#f0f");
      target_palette = $(this);
   });
   // マウス click → color pick
   $('#target').mouseup(function(e){
      var canvas = document.getElementById("target");
      var pixelData = canvas.getContext('2d').getImageData(e.offsetX, e.offsetY, 1, 1).data;
      var hexR = toHex(pixelData[0]);
      var hexG = toHex(pixelData[1]);
      var hexB = toHex(pixelData[2]);
      target_palette.css("background-color", "#" + hexR + hexG + hexB);
   });
   // 画像合成
   $(".set_width").mouseup(function(e){
      drawPallete();
   });
   $(".set_height").mouseup(function(e){
      drawPallete(false);
   });
   // ダウンロード画像
   $(".download").mouseup(function(e) {
       var canvas = document.getElementById("target");
       var base64 = canvas.toDataURL();
       window.open(base64, '_blank');
   })
   // 画像90度回転
   $(".rotate").mouseup(function(e) {
      var target = document.getElementById("target");
      var context = target.getContext('2d');
      var rad = 90 * Math.PI/180;
      var image_width = target.width;
      var image_height = target.height;
      var cx = image_width/2;
      var cy = target.height/2;
      //変形マトリックスに回転を適用:中心で回転させるために縦横の半分の位置へ同時に移動
      context.setTransform(Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), image_width/2, image_height/2);
      //tranformで移動した分だけtranslateで戻して原点を0，0に
      context.translate( -1 * image_width/2, -1 * image_height/2 ); 
      //読み込んだimgをcanvas(c1)に貼付け
      context.drawImage(target, 0, 0);
   })
});

function drawPallete(is_width) {
   if (is_width == undefined) is_width = true;
   var palettes = $(".palette");
   var palette = $(".palette:first");
   var target = document.getElementById("target");
   var context = target.getContext('2d');
   var width = Number(palette.css("width").replace("px",""));
   var height = Number(palette.css("height").replace("px",""));
   var margin_width = Number(palette.css("margin-left").replace("px",""));
   var border_width = Number(palette.css("margin-left").replace("px",""));
   var l = palettes.length;
   var total_width = (width+margin_width*2+border_width);
   var x = parseInt(target.width/2 - total_width*l/2);
   var y = parseInt(target.height/2 - height/2);
   palettes.map(function(i){
      var color = $(this).css("background-color");
      if(is_width){
         context.setTransform(1, 0, 0, 1, 0, 0); 
      } else {
         var rad = 90 * Math.PI/180;
         var image_width = target.width;
         var image_height = target.height;
         var cx = image_width/2;
         var cy = target.height/2;
         //変形マトリックスに回転を適用:中心で回転させるために縦横の半分の位置へ同時に移動
         context.setTransform(Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), image_width/2, image_height/2);
         //tranformで移動した分だけtranslateで戻して原点を0，0に
         context.translate( -1 * image_width/2, -1 * image_height/2 ); 
      }
      context.fillStyle = color;
      context.fillRect(x+i*total_width,y,width+border_width,height);
   });
}

function imageLoad() {
   if (window.File){
      var input = document.getElementById("imgfile");
      var reader = new FileReader();
      reader.readAsDataURL(input.files[0]);
      reader.onloadend = function(event){
         var img = new Image();
         img.onload = function() {
            var canvas = document.getElementById("target");
            var w = img.width;
            var h = img.height;
            var size = (w<h)? w : h; //読み込んだ画像の縦横どちらか小さい方を代入
            var cx = w/2;
            var cy = h/2;
            var image_size = (size<target_image_size)? size : target_image_size; //読み込んだ画像のサイズのほうが小さければ代入
            canvas.width = image_size;
            canvas.height = image_size;
            var context = canvas.getContext('2d');
            //var margin = parseInt($("body").css("margin").replace("px",""));
            drawImageIOSFix(context, img, cx-size/2, cy-size/2, size, size, 0, 0, image_size, image_size);
         }
         img.src = event.target.result;
      }
   }
}
/**
 * Detecting vertical squash in loaded image.
 * Fixes a bug which squash image vertically while drawing into canvas for some images.
 * This is a bug in iOS6 devices. This function from https://github.com/stomita/ios-imagefile-megapixel
 * 
 */
function detectVerticalSquash(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, 1, ih).data;
    // search image edge pixel position in case it is squashed vertically.
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
        var alpha = data[(py - 1) * 4 + 3];
        if (alpha === 0) {
            ey = py;
        } else {
            sy = py;
        }
        py = (ey + sy) >> 1;
    }
    var ratio = (py / ih);
    return (ratio===0)?1:ratio;
}

/**
 * A replacement for context.drawImage
 * (args are for source and destination).
 */
function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    var vertSquashRatio = detectVerticalSquash(img);
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
}

function changeParamater() {
   var palettes = $(".palette");
   var palette = $(".palette:first");
   var w = $("#palette_width").val();
   palettes.map(function() {
      $(this).css("width",w+"px"); 
   });
   if(window.sessionStorage){
      sessionStorage.setItem("width", w);
   }
   var h = $("#palette_height").val();
   palettes.map(function() {
      $(this).css("height",h+"px"); 
   });
   if(window.sessionStorage){
      sessionStorage.setItem("height", h);
   }
   var m = $("#palette_margin").val();
   palettes.map(function() {
      $(this).css("margin",m+"px"); 
   });
   if(window.sessionStorage){
      sessionStorage.setItem("margin", m);
   }
}