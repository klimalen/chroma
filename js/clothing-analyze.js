window.SEASON_PALETTES_LAB={
  spring:[{L:78,a:12,b:38},{L:62,a:32,b:28},{L:72,a:22,b:32},{L:58,a:5,b:22},{L:82,a:4,b:14},{L:65,a:28,b:18},{L:70,a:8,b:35}],
  summer:[{L:72,a:12,b:-14},{L:62,a:4,b:-18},{L:68,a:18,b:-8},{L:58,a:4,b:-10},{L:74,a:14,b:-4},{L:60,a:8,b:-20},{L:76,a:2,b:-6}],
  autumn:[{L:42,a:32,b:38},{L:54,a:14,b:42},{L:48,a:8,b:28},{L:38,a:26,b:22},{L:44,a:18,b:32},{L:52,a:6,b:20},{L:34,a:10,b:16}],
  winter:[{L:10,a:2,b:-2},{L:94,a:0,b:2},{L:28,a:4,b:-34},{L:38,a:42,b:-22},{L:32,a:10,b:-28},{L:44,a:-12,b:-20},{L:50,a:36,b:-10}]
};

window.isBackgroundPixel=function(r,g,b){
  if(r>230&&g>230&&b>230)return true;
  if(r<20&&g<20&&b<20)return true;
  var mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx===0?0:(mx-mn)/mx;
  if(sat<0.08&&r>180&&r<235)return true;
  return false;
};

window.extractClothingPixels=function(id){
  var W=id.width,H=id.height,d=id.data,pixels=[];
  var x0=Math.floor(W*0.20),x1=Math.floor(W*0.80),y0=Math.floor(H*0.10),y1=Math.floor(H*0.90);
  var cx=W/2,cy=H/2,sx=W*0.3,sy=H*0.4;
  for(var y=y0;y<y1;y+=2){
    for(var x=x0;x<x1;x+=2){
      var i=(y*W+x)*4,r=d[i],g=d[i+1],b=d[i+2];
      if(window.isBackgroundPixel(r,g,b))continue;
      var dx=(x-cx)/sx,dy=(y-cy)/sy,weight=Math.exp(-(dx*dx+dy*dy)/2);
      pixels.push({r:r,g:g,b:b,w:weight});
    }
  }
  return pixels;
};

window.getWeightedDominantColor=function(pixels){
  if(!pixels.length)return{r:128,g:128,b:128};
  var buckets={},keys,k,totalW=0,threshold,best=null,bestW=0;
  for(var i=0;i<pixels.length;i++){
    var p=pixels[i],qr=Math.round(p.r/20)*20,qg=Math.round(p.g/20)*20,qb=Math.round(p.b/20)*20,key=qr+','+qg+','+qb;
    if(!buckets[key])buckets[key]={r:qr,g:qg,b:qb,w:0};
    buckets[key].w+=p.w;
  }
  keys=Object.keys(buckets);
  for(k=0;k<keys.length;k++)totalW+=buckets[keys[k]].w;
  threshold=totalW*0.01;
  for(k=0;k<keys.length;k++){var bk=buckets[keys[k]];if(bk.w>threshold&&bk.w>bestW){bestW=bk.w;best=bk;}}
  return best||{r:128,g:128,b:128};
};

window.getTopColors=function(pixels,topN){
  if(!pixels.length)return[];
  var buckets={},totalW=0;
  for(var i=0;i<pixels.length;i++){
    var p=pixels[i],qr=Math.round(p.r/24)*24,qg=Math.round(p.g/24)*24,qb=Math.round(p.b/24)*24,key=qr+','+qg+','+qb;
    if(!buckets[key])buckets[key]={r:qr,g:qg,b:qb,w:0};
    buckets[key].w+=p.w;
  }
  var arr=Object.keys(buckets).map(function(k){totalW+=buckets[k].w;return buckets[k];});
  arr.sort(function(a,b){return b.w-a.w;});
  var thr=totalW*0.03;
  return arr.filter(function(b){return b.w>=thr;}).slice(0,topN||3);
};

window.analyzeClothing=function(imgObj,sid){
  return new Promise(function(resolve){
    var id=window.getImageData(imgObj),clothingPixels=window.extractClothingPixels(id);
    if(clothingPixels.length<50){
      var W=id.width,H=id.height,d=id.data;clothingPixels=[];
      for(var y=Math.floor(H*0.15);y<Math.floor(H*0.85);y+=3)
        for(var x=Math.floor(W*0.20);x<Math.floor(W*0.80);x+=3){
          var i=(y*W+x)*4;clothingPixels.push({r:d[i],g:d[i+1],b:d[i+2],w:1});
        }
    }
    var dom=window.getWeightedDominantColor(clothingPixels),
        hsv=window.rgbToHsv(dom.r,dom.g,dom.b),
        lab=window.rgbToLab(dom.r,dom.g,dom.b),
        topColors=window.getTopColors(clothingPixels,3);
    var temp=lab.b>8?'warm':lab.b<-4?'cool':'neutral',
        br=lab.L>65?'light':lab.L>40?'medium':'dark',
        sat=hsv.s<0.22?'muted':hsv.s<0.58?'medium':'bright',
        ck=window.getColorKey(hsv.h,hsv.s,hsv.v),
        pal=window.SEASON_PALETTES_LAB[sid];
    var dists=pal.map(function(ref){return window.deltaE(lab,ref);}),
        md=Math.min.apply(null,dists),secondaryBonus=0;
    if(topColors.length>1){
      for(var tc=1;tc<Math.min(topColors.length,3);tc++){
        var tc_lab=window.rgbToLab(topColors[tc].r,topColors[tc].g,topColors[tc].b),
            tc_dists=pal.map(function(ref){return window.deltaE(tc_lab,ref);}),
            tc_md=Math.min.apply(null,tc_dists);
        secondaryBonus+=(50-Math.min(tc_md,50))*0.08;
      }
    }
    var iw=(sid==='spring'||sid==='autumn'),tb=0,sb=0;
    if(iw&&temp==='warm')tb=8;if(iw&&temp==='cool')tb=-8;
    if(!iw&&temp==='cool')tb=8;if(!iw&&temp==='warm')tb=-8;
    if((sid==='spring'||sid==='winter')&&sat==='bright')sb=5;
    if((sid==='summer'||sid==='autumn')&&sat==='muted')sb=5;
    if((sid==='summer'||sid==='autumn')&&sat==='bright')sb=-5;
    var score=Math.round(Math.max(0,Math.min(100,100-md*1.5+tb+sb+secondaryBonus))),
        verdict=score>=75?'fits':score>=45?'neutral':'not_fits';
    var ar=id.width/id.height,
        cat=ar>1.4?{ru:'верх',en:'top'}:ar<0.6?{ru:'платье',en:'dress'}:{ru:'другое',en:'other'};
    var s=window.SEASONS[sid];
    resolve({color_key:ck,color_temperature:temp,brightness:br,saturation:sat,category:cat,color_match_score:score,verdict:verdict,season_name:s.name,season_best:s.best});
  });
};
