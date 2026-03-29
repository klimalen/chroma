window.detectColorType=function(imgObj){
  return new Promise(function(resolve){
    var id=window.getImageData(imgObj),W=id.width,H=id.height,d=id.data;
    var skin=window.getSkinPixels(id,0.65);
    if(skin.length<200)skin=window.getSkinPixels(id,0.95);
    if(skin.length<100){
      skin=[];
      for(var y=Math.floor(H*0.2);y<Math.floor(H*0.6);y++)
        for(var x=Math.floor(W*0.3);x<Math.floor(W*0.7);x++){
          var i=(y*W+x)*4;skin.push({r:d[i],g:d[i+1],b:d[i+2]});
        }
    }
    var sR=0,sG=0,sB=0;
    for(var k=0;k<skin.length;k++){sR+=skin[k].r;sG+=skin[k].g;sB+=skin[k].b;}
    var lab=window.rgbToLab(sR/skin.length,sG/skin.length,sB/skin.length);
    var ws=lab.b*0.7+lab.a*0.3,ut=ws>10?'warm':ws<3?'cool':'neutral';
    var L=lab.L,st=L>68?'light':L>52?'medium':L>38?'olive':'dark';
    var lum=[];
    for(var j=0;j<d.length;j+=4)lum.push(0.299*d[j]+0.587*d[j+1]+0.114*d[j+2]);
    var cv=window.percentile(lum,90)-window.percentile(lum,10),ct=cv>140?'high':cv>80?'medium':'low';
    var mx={warm:{light:'spring',medium:ct==='high'?'spring':'autumn',olive:'autumn',dark:'autumn'},cool:{light:'summer',medium:ct==='high'?'winter':'summer',olive:'winter',dark:'winter'},neutral:{light:'summer',medium:'spring',olive:'autumn',dark:'winter'}};

    function hair(id){
      var W=id.width,H=id.height,d=id.data,sR=0,sG=0,sB=0,c=0,y1=Math.floor(H*0.18),x0=Math.floor(W*0.25),x1=Math.floor(W*0.75);
      for(var y=0;y<y1;y++)for(var x=x0;x<x1;x++){var i=(y*W+x)*4;sR+=d[i];sG+=d[i+1];sB+=d[i+2];c++;}
      if(!c)return{ru:'неизвестно',en:'unknown'};
      var h=window.rgbToHsv(sR/c,sG/c,sB/c);
      if(h.v<0.25)return{ru:'чёрные',en:'black'};
      if(h.v>0.80&&h.s<0.20)return{ru:'светлые',en:'blonde'};
      if(h.h<40&&h.s>0.20)return{ru:'рыжие',en:'red'};
      if(h.v<0.55)return{ru:'тёмно-коричневые',en:'dark brown'};
      return{ru:'коричневые',en:'brown'};
    }
    function eye(id){
      var W=id.width,H=id.height,d=id.data,sR=0,sG=0,sB=0,c=0,y0=Math.floor(H*0.30),y1=Math.floor(H*0.45),x0=Math.floor(W*0.20),x1=Math.floor(W*0.80);
      for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var i=(y*W+x)*4;if(d[i]>200&&d[i+1]>200&&d[i+2]>200)continue;sR+=d[i];sG+=d[i+1];sB+=d[i+2];c++;}
      if(!c)return{ru:'неизвестно',en:'unknown'};
      var h=window.rgbToHsv(sR/c,sG/c,sB/c);
      if(h.v<0.30)return{ru:'тёмно-карие',en:'dark brown'};
      if(h.h>180&&h.h<260)return{ru:'голубые',en:'blue'};
      if(h.h>=80&&h.h<=160)return{ru:'зелёные',en:'green'};
      if(h.h<50&&h.s>0.20)return{ru:'ореховые',en:'hazel'};
      return{ru:'карие',en:'brown'};
    }

    resolve({
      color_type:mx[ut][st],
      confidence_score:parseFloat(Math.min(0.92,0.55+Math.abs(ws)*0.018+(cv/255)*0.15).toFixed(2)),
      skin_tone:st,undertone:ut,
      hair_color:hair(id),eye_color:eye(id),contrast_level:ct
    });
  });
};
