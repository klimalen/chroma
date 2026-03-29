window.DBManager=(function(){
  function sb(){return window._supabase;}

  async function ensureProfile(user){
    if(!sb())return null;
    var sel=await sb().from('users').select('*').eq('id',user.id).single();
    if(sel.data)return sel.data;
    var ins=await sb().from('users').insert({
      id:user.id,email:user.email,
      created_at:new Date().toISOString(),
      has_migrated_local_data:false
    }).select().single();
    if(ins.error){console.error('ensureProfile error:',ins.error);return null;}
    return ins.data;
  }

  async function loadProfile(userId){
    if(!sb())return null;
    var res=await sb().from('users').select('*').eq('id',userId).single();
    return res.data||null;
  }

  async function updateProfile(userId,fields){
    if(!sb())return;
    await sb().from('users').update(fields).eq('id',userId);
  }

  async function deleteProfile(userId){
    if(!sb())return;
    await sb().from('outfit_analysis_history').delete().eq('user_id',userId);
    await sb().from('color_type_history').delete().eq('user_id',userId);
    await sb().from('users').delete().eq('id',userId);
  }

  async function saveColorType(userId,colorType,source){
    if(!sb())return;
    await sb().from('color_type_history').insert({
      user_id:userId,color_type:colorType,
      source:source||'manual',
      created_at:new Date().toISOString()
    });
  }

  async function loadOutfitHistory(userId){
    if(!sb())return[];
    var res=await sb().from('outfit_analysis_history')
      .select('*').eq('user_id',userId)
      .order('created_at',{ascending:false});
    return res.data||[];
  }

  async function saveOutfitAnalysis(userId,item){
    if(!sb())return null;
    var res=await sb().from('outfit_analysis_history').insert({
      user_id:userId,
      result_status:(item.result&&item.result.verdict)||'neutral',
      result_title:(item.result&&item.result.color_key)||null,
      result_description:item.result?JSON.stringify(item.result):null,
      local_preview_key:'local_'+(item.id||Date.now()),
      created_at:item.created_at||new Date().toISOString()
    }).select().single();
    return res.data||null;
  }

  async function deleteOutfitAnalysis(userId,recordId){
    if(!sb())return;
    await sb().from('outfit_analysis_history')
      .delete().eq('user_id',userId).eq('id',String(recordId));
  }

  async function deleteAllOutfitHistory(userId){
    if(!sb())return;
    await sb().from('outfit_analysis_history').delete().eq('user_id',userId);
  }

  async function migrateLocalData(userId,localHistory,profile){
    if(!sb())return;
    if(!localHistory||!localHistory.length)return;
    if(profile&&profile.has_migrated_local_data)return;
    var existing=await sb().from('outfit_analysis_history')
      .select('created_at').eq('user_id',userId);
    var existingDates=new Set((existing.data||[]).map(function(r){return r.created_at;}));
    var toInsert=[];
    for(var i=0;i<localHistory.length;i++){
      var item=localHistory[i];
      var dt=item.created_at||new Date(item.id||Date.now()).toISOString();
      if(existingDates.has(dt))continue;
      toInsert.push({
        user_id:userId,
        result_status:(item.result&&item.result.verdict)||'neutral',
        result_title:(item.result&&item.result.color_key)||null,
        result_description:item.result?JSON.stringify(item.result):null,
        local_preview_key:'local_'+(item.id||i),
        created_at:dt
      });
    }
    if(toInsert.length){
      var ins=await sb().from('outfit_analysis_history').insert(toInsert);
      if(ins.error){console.error('Migration error:',ins.error);throw ins.error;}
    }
    await sb().from('users').update({has_migrated_local_data:true}).eq('id',userId);
  }

  return{
    ensureProfile,loadProfile,updateProfile,deleteProfile,
    saveColorType,loadOutfitHistory,saveOutfitAnalysis,
    deleteOutfitAnalysis,deleteAllOutfitHistory,migrateLocalData
  };
})();
