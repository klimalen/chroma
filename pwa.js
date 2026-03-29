(function(){
  'use strict';

  function makeIcon(size){
    var canvas=document.createElement('canvas');
    canvas.width=size;canvas.height=size;
    var ctx=canvas.getContext('2d');
    ctx.fillStyle='#1a1a18';ctx.beginPath();
    var r=size*0.22;
    ctx.moveTo(r,0);ctx.lineTo(size-r,0);ctx.quadraticCurveTo(size,0,size,r);
    ctx.lineTo(size,size-r);ctx.quadraticCurveTo(size,size,size-r,size);
    ctx.lineTo(r,size);ctx.quadraticCurveTo(0,size,0,size-r);
    ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);
    ctx.closePath();ctx.fill();
    ctx.font=(size*0.52)+'px serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🎨',size/2,size/2+size*0.03);
    return canvas.toDataURL('image/png');
  }

  var icon192=makeIcon(192), icon512=makeIcon(512);
  window._PWA_ICON_192=icon192;
  window._PWA_ICON_512=icon512;
  document.getElementById('apple-touch-icon').href=icon192;

  var manifest={
    name:'Chromé',short_name:'Chromé',
    description:'Определи свой цветотип и анализируй одежду без интернета',
    start_url:window.location.href,
    scope:window.location.origin+'/',
    display:'standalone',orientation:'portrait-primary',
    background_color:'#fafaf8',theme_color:'#1a1a18',
    lang:'ru',categories:['lifestyle','fashion'],
    icons:[
      {src:icon192,sizes:'192x192',type:'image/png',purpose:'any maskable'},
      {src:icon512,sizes:'512x512',type:'image/png',purpose:'any maskable'}
    ]
  };
  var mBlob=new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'});
  document.getElementById('pwa-manifest').href=URL.createObjectURL(mBlob);

  var swCode='var CACHE_NAME="chrome-wardrobe-v'+window.APP_VERSION+'";'
    +'var OFFLINE_URL=self.location.href;'
    +'var PRECACHE_URLS=[self.location.href,'
    +'"https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",'
    +'"https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",'
    +'"https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"];'
    +'self.addEventListener("install",function(e){e.waitUntil(caches.open(CACHE_NAME).then(function(c){return Promise.allSettled(PRECACHE_URLS.map(function(u){return c.add(u).catch(function(){});}));}).then(function(){return self.skipWaiting();}));});'
    +'self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ns){return Promise.all(ns.filter(function(n){return n.startsWith("chrome-wardrobe-")&&n!==CACHE_NAME;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});'
    +'self.addEventListener("fetch",function(e){if(e.request.method!=="GET")return;if(e.request.url.startsWith("chrome-extension://"))return;if(e.request.url.startsWith("blob:"))return;e.respondWith(caches.match(e.request).then(function(cached){if(cached){fetch(e.request).then(function(r){if(r&&r.status===200)caches.open(CACHE_NAME).then(function(c){c.put(e.request,r);});}).catch(function(){});return cached;}return fetch(e.request.clone()).then(function(r){if(r&&r.status===200){var cl=r.clone();caches.open(CACHE_NAME).then(function(c){c.put(e.request,cl);});}return r;}).catch(function(){return caches.match(OFFLINE_URL).then(function(f){return f||new Response("<html><body style=\'font-family:Georgia,serif;text-align:center;padding:4rem;\'><h2>🎨 Chromé</h2><p style=\'color:#888;margin-top:1rem;\'>Нет подключения к интернету.</p></body></html>",{headers:{"Content-Type":"text/html"}});});});}));});'
    +'self.addEventListener("message",function(e){if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting();});';

  if('serviceWorker' in navigator){
    var swBlob=new Blob([swCode],{type:'application/javascript'});
    navigator.serviceWorker.register(URL.createObjectURL(swBlob),{scope:'./'}).then(function(reg){
      window._SW_REGISTRATION=reg;
      setInterval(function(){reg.update();},30*60*1000);
      reg.addEventListener('updatefound',function(){
        var nw=reg.installing;
        nw.addEventListener('statechange',function(){
          if(nw.state==='installed'&&navigator.serviceWorker.controller)
            window.dispatchEvent(new CustomEvent('sw-update-available'));
        });
      });
    }).catch(function(){});
  }

  window._pwaInstallPrompt=null;
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();window._pwaInstallPrompt=e;
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });
  window.addEventListener('appinstalled',function(){
    window._pwaInstallPrompt=null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
  window.isPWAStandalone=function(){
    return window.matchMedia('(display-mode: standalone)').matches
      ||window.navigator.standalone===true
      ||document.referrer.includes('android-app://');
  };
})();
