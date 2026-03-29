window.AuthManager=(function(){
  var _user=null,_listeners=[];

  function notify(u){
    _user=u;
    _listeners.forEach(function(fn){try{fn(u);}catch(e){}});
  }
  function onAuthChange(fn){
    _listeners.push(fn);
    return function(){_listeners=_listeners.filter(function(l){return l!==fn;});};
  }
  function init(){
    if(!window._supabase)return;
    window._supabase.auth.getSession().then(function(res){
      _user=(res.data&&res.data.session)?res.data.session.user:null;
      notify(_user);
    });
    window._supabase.auth.onAuthStateChange(function(event,session){
      notify(session?session.user:null);
    });
  }
  function getUser(){return _user;}

  async function signUp(email,password){
    if(!window._supabase)throw new Error('no_supabase');
    var res=await window._supabase.auth.signUp({email:email,password:password});
    if(res.error)throw res.error;
    return res.data;
  }
  async function signIn(email,password){
    if(!window._supabase)throw new Error('no_supabase');
    var res=await window._supabase.auth.signInWithPassword({email:email,password:password});
    if(res.error)throw res.error;
    return res.data;
  }
  async function signOut(){
    if(!window._supabase)throw new Error('no_supabase');
    var res=await window._supabase.auth.signOut();
    if(res.error)throw res.error;
    _user=null;notify(null);
  }
  async function deleteAuthUser(){
    if(!window._supabase)return;
    try{await window._supabase.rpc('delete_auth_user');}
    catch(e){console.warn('delete_auth_user rpc not available:',e);}
  }

  return{init,getUser,signUp,signIn,signOut,onAuthChange,deleteAuthUser};
})();
