window.SessionManager=(function(){
  var SK='chrome_session_id',PK='chrome_profile',HK='chrome_history';

  function uuid(){
    if(typeof crypto!=='undefined'&&crypto.randomUUID)return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);
    });
  }
  function valid(id){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }
  function gc(n){
    try{var m=document.cookie.match(new RegExp('(^|;)\\s*'+n+'\\s*=\\s*([^;]+)'));return m?m[2]:null;}
    catch(e){return null;}
  }
  function sc(n,v){
    try{
      var d=new Date();d.setTime(d.getTime()+90*24*60*60*1000);
      document.cookie=n+'='+v+';expires='+d.toUTCString()+';path=/;SameSite=Strict';
    }catch(e){}
  }
  function get(){
    var id=null;
    try{id=localStorage.getItem(SK);}catch(e){}
    if(!id||!valid(id))id=gc(SK);
    if(!id||!valid(id))id=uuid();
    try{localStorage.setItem(SK,id);}catch(e){}
    sc(SK,id);return id;
  }

  return{
    init:get,getId:get,
    saveProfile:function(sid){
      var p={season_id:sid,set_at:new Date().toISOString(),session_id:get()};
      try{localStorage.setItem(PK,JSON.stringify(p));}catch(e){}
      return p;
    },
    loadProfile:function(){
      try{var r=localStorage.getItem(PK);return r?JSON.parse(r):null;}catch(e){return null;}
    },
    saveHistory:function(items){
      try{localStorage.setItem(HK,JSON.stringify(items));}catch(e){}
    },
    loadHistory:function(){
      try{var r=localStorage.getItem(HK);return r?JSON.parse(r):[];}catch(e){return[];}
    },
    clearLocalOnly:function(){
      try{localStorage.removeItem(PK);localStorage.removeItem(HK);}catch(e){}
    },
    clearAll:function(){
      try{localStorage.removeItem(SK);localStorage.removeItem(PK);localStorage.removeItem(HK);}catch(e){}
      try{document.cookie=SK+'=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';}catch(e){}
      return get();
    }
  };
})();
