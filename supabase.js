(function(){
  var SUPABASE_URL='https://omohytnqwnmejjrsrmvl.supabase.co';
  var SUPABASE_KEY='sb_publishable_6zpnsOFSARIZJi3LO30kDA_LWtjWSlN';
  try{
    window._supabase=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  }catch(e){
    console.error('Supabase init error:',e);
    window._supabase=null;
  }
})();
