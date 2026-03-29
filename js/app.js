const {useState,useEffect,useRef,useCallback}=React;

/* ── HOOKS ── */
function useLang(){
  const[lang,setLang]=useState(window.LANG);
  useEffect(()=>{window.__langCallback=setLang;return()=>{window.__langCallback=null;};},[]);
  const t=k=>window.T[lang][k]||window.T['ru'][k]||k;
  const s=o=>typeof o==='object'&&o!==null?(o[lang]||o['ru']):o;
  return{lang,t,s};
}

function usePWA(){
  const[installable,setInstallable]=useState(!!window._pwaInstallPrompt);
  const[installed,setInstalled]=useState(window.isPWAStandalone&&window.isPWAStandalone());
  const[updateReady,setUpdateReady]=useState(false);
  const[isOnline,setIsOnline]=useState(navigator.onLine);
  useEffect(()=>{
    const a=()=>setInstallable(true),b=()=>{setInstalled(true);setInstallable(false);},
          c=()=>setUpdateReady(true),d=()=>setIsOnline(true),e=()=>setIsOnline(false);
    window.addEventListener('pwa-installable',a);window.addEventListener('pwa-installed',b);
    window.addEventListener('sw-update-available',c);window.addEventListener('online',d);window.addEventListener('offline',e);
    return()=>{window.removeEventListener('pwa-installable',a);window.removeEventListener('pwa-installed',b);
      window.removeEventListener('sw-update-available',c);window.removeEventListener('online',d);window.removeEventListener('offline',e);};
  },[]);
  const promptInstall=async()=>{if(!window._pwaInstallPrompt)return;window._pwaInstallPrompt.prompt();const{outcome}=await window._pwaInstallPrompt.userChoice;if(outcome==='accepted'){window._pwaInstallPrompt=null;setInstallable(false);}};
  const applyUpdate=()=>{if(window._SW_REGISTRATION&&window._SW_REGISTRATION.waiting)window._SW_REGISTRATION.waiting.postMessage({type:'SKIP_WAITING'});window.location.reload();};
  return{installable,installed,updateReady,isOnline,promptInstall,applyUpdate};
}

function useFileLoader(t,lang){
  const[imgObj,setImgObj]=useState(null);const[converting,setConverting]=useState(null);const[fileErr,setFileErr]=useState(null);
  const load=async f=>{setConverting(null);setFileErr(null);setImgObj(null);try{const r=await window.compressImage(f,st=>{setConverting(st==='converting'?t('convertingHeic'):null);});setConverting(null);setImgObj(r);}catch(e){setConverting(null);const code=e.message?e.message.split(':')[0]:'reader';setFileErr(window.getErrMsg(code,lang||window.LANG));}};
  return{imgObj,converting,fileErr,load,reset:()=>{setImgObj(null);setFileErr(null);}};
}

function useAuth(){
  const[user,setUser]=useState(null);
  const[authReady,setAuthReady]=useState(false);
  useEffect(()=>{
    window.AuthManager.init();
    const unsub=window.AuthManager.onAuthChange(u=>{setUser(u);setAuthReady(true);});
    const tm=setTimeout(()=>setAuthReady(true),3000);
    return()=>{unsub();clearTimeout(tm);};
  },[]);
  return{user,authReady};
}

/* ── UI ATOMS ── */
function Btn({children,onClick,variant='primary',full,small,disabled,style={}}){
  const st={
    primary:{background:'#1a1a18',color:'#fafaf8',border:'none',padding:small?'8px 16px':'12px 24px'},
    secondary:{background:'transparent',color:'#1a1a18',border:'1px solid #c8c4bc',padding:small?'7px 15px':'11px 23px'},
    ghost:{background:'none',border:'none',color:'#888880',fontSize:14},
    danger:{background:'#fce4ec',color:'#b71c1c',border:'1px solid #f48fb1',padding:small?'7px 15px':'11px 23px'},
    success:{background:'#e8f5e9',color:'#2e7d32',border:'1px solid #a5d6a7',padding:small?'7px 15px':'11px 23px'}
  };
  return<button onClick={disabled?undefined:onClick} style={{...(st[variant]||st.primary),fontFamily:'Georgia,serif',fontSize:small?13:15,fontWeight:400,borderRadius:6,cursor:disabled?'not-allowed':'pointer',width:full?'100%':'auto',opacity:disabled?0.4:1,transition:'all 0.15s',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,letterSpacing:'0.01em',...style}}>{children}</button>;
}
function Chip({verdict,t}){const m={fits:{label:t('verdictFits'),bg:'#e8f5e9',c:'#2e7d32',b:'#a5d6a7'},neutral:{label:t('verdictNeutral'),bg:'#fff8e1',c:'#f57f17',b:'#ffe082'},not_fits:{label:t('verdictNot'),bg:'#fce4ec',c:'#b71c1c',b:'#f48fb1'}};const v=m[verdict]||m.neutral;return<span style={{display:'inline-block',background:v.bg,color:v.c,border:'1px solid '+v.b,borderRadius:20,padding:'4px 14px',fontSize:13,letterSpacing:'0.02em'}}>{v.label}</span>;}
function Score({n,t}){const c=n>=75?'#2e7d32':n>=45?'#f57f17':'#b71c1c';return<div style={{width:'100%'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:12,color:'#888880'}}>{t('scoreLabel')}</span><span style={{fontSize:12,color:c}}>{n}/100</span></div><div style={{height:4,background:'#e8e4dc',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:n+'%',background:c,borderRadius:2,transition:'width 1.2s ease'}}/></div></div>;}
function Card({children,style={}}){return<div style={{background:'#fff',border:'1px solid #e8e4dc',borderRadius:10,padding:'1rem 1.25rem',...style}}>{children}</div>;}
function Lbl({children}){return<div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{children}</div>;}
function Spin(){return<span style={{display:'inline-block',width:16,height:16,borderRadius:'50%',border:'2px solid #c8c4bc',borderTopColor:'#1a1a18',animation:'spin 0.7s linear infinite'}}/>;}
function ImagePlaceholder({size}){const sz=size||56;return<div style={{width:sz,height:sz,borderRadius:5,background:'#f5f2eb',border:'1px solid #e8e4dc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(sz*0.45),flexShrink:0}}>👗</div>;}

function Drop({onSelect,preview,label,sub,converting}){
  const ref=useRef(null);const[drag,setDrag]=useState(false);const handle=useCallback(f=>{if(f)onSelect(f);},[onSelect]);
  return<div onClick={()=>!converting&&ref.current&&ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);if(!converting)handle(e.dataTransfer.files[0]);}} style={{border:'1.5px dashed '+(drag?'#888880':'#c8c4bc'),borderRadius:10,cursor:converting?'default':'pointer',overflow:'hidden',background:drag?'#f5f2eb':'transparent',transition:'all 0.15s',minHeight:160,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
    {converting?<div style={{textAlign:'center',padding:'2rem'}}><div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Spin/></div><div style={{fontSize:13,color:'#888880'}}>{converting}</div></div>:preview?<img src={preview} style={{width:'100%',maxHeight:280,objectFit:'contain'}} alt="preview"/>:<div style={{textAlign:'center',padding:'2rem 1rem'}}><div style={{fontSize:28,marginBottom:10}}>📷</div><div style={{fontSize:14,color:'#444440',marginBottom:4}}>{label}</div>{sub&&<div style={{fontSize:12,color:'#aaa'}}>{sub}</div>}</div>}
    <input ref={ref} type="file" accept="image/*,.heic,.heif" style={{display:'none'}} onChange={e=>handle(e.target.files[0])}/>
  </div>;
}

/* ── MODALS ── */
function DeleteConfirmModal({onConfirm,onCancel,t}){
  return<div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
    <div className="modal-box" style={{maxWidth:360}}>
      <div style={{fontSize:28,marginBottom:12,textAlign:'center'}}>⚠️</div>
      <h2 style={{fontSize:18,fontWeight:400,marginBottom:'0.75rem',textAlign:'center'}}>{t('authDeleteConfirmTitle')}</h2>
      <p style={{fontSize:13,color:'#666660',lineHeight:1.7,marginBottom:'1.5rem',textAlign:'center'}}>{t('authDeleteConfirmText')}</p>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <Btn onClick={onConfirm} variant="danger" full>{t('authDeleteConfirmBtn')}</Btn>
        <Btn onClick={onCancel} variant="secondary" full>{t('authDeleteCancelBtn')}</Btn>
      </div>
    </div>
  </div>;
}

function AuthModal({initialMode,onClose,onSuccess,t}){
  const[mode,setMode]=useState(initialMode||'login');
  const[email,setEmail]=useState('');const[password,setPassword]=useState('');
  const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[infoMsg,setInfoMsg]=useState('');
  function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
  function mapError(err){const msg=(err.message||'').toLowerCase();if(msg.includes('invalid login')||msg.includes('invalid credentials'))return t('authErrInvalidCredentials');if(msg.includes('user not found'))return t('authErrUserNotFound');if(msg.includes('already registered')||msg.includes('already exists')||msg.includes('duplicate'))return t('authErrEmailTaken');if(msg.includes('email not confirmed'))return t('authErrSignUpConfirm');return t('authErrGeneric');}
  async function handleSubmit(e){
    e.preventDefault();setError('');setInfoMsg('');
    if(!email.trim()){setError(t('authErrEmailRequired'));return;}
    if(!validateEmail(email)){setError(t('authErrEmailInvalid'));return;}
    if(!password){setError(t('authErrPasswordRequired'));return;}
    if(password.length<6){setError(t('authErrPasswordShort'));return;}
    setLoading(true);
    try{
      if(mode==='register'){const data=await window.AuthManager.signUp(email,password);if(data&&data.user&&!data.session){setInfoMsg(t('authErrSignUpConfirm'));setLoading(false);return;}if(data&&data.user){onSuccess(data.user,'register');}}
      else{const data=await window.AuthManager.signIn(email,password);if(data&&data.user){onSuccess(data.user,'login');}}
    }catch(err){setError(mapError(err));}
    setLoading(false);
  }
  return<div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal-box">
      <button onClick={onClose} style={{position:'absolute',top:14,right:16,background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#aaa8a0',lineHeight:1}}>×</button>
      <h2 style={{fontSize:20,fontWeight:400,marginBottom:'1.25rem',letterSpacing:'-0.01em'}}>{mode==='login'?t('authLoginTitle'):t('authRegisterTitle')}</h2>
      {infoMsg&&<div style={{background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#2e7d32',marginBottom:'1rem',lineHeight:1.5}}>{infoMsg}</div>}
      {error&&<div style={{background:'#fce4ec',border:'1px solid #f48fb1',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#b71c1c',marginBottom:'1rem',lineHeight:1.5}}>{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{marginBottom:'0.875rem'}}>
          <label style={{display:'block',fontSize:12,color:'#888880',marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>{t('authEmail')}</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} autoComplete="email" style={{width:'100%',border:'1px solid #c8c4bc',borderRadius:7,padding:'10px 12px',fontSize:15,fontFamily:'Georgia,serif',background:'#fafaf8',color:'#1a1a18',outline:'none'}} onFocus={e=>e.target.style.borderColor='#1a1a18'} onBlur={e=>e.target.style.borderColor='#c8c4bc'}/>
        </div>
        <div style={{marginBottom:'1.25rem'}}>
          <label style={{display:'block',fontSize:12,color:'#888880',marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>{t('authPassword')}</label>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('');}} autoComplete={mode==='register'?'new-password':'current-password'} style={{width:'100%',border:'1px solid #c8c4bc',borderRadius:7,padding:'10px 12px',fontSize:15,fontFamily:'Georgia,serif',background:'#fafaf8',color:'#1a1a18',outline:'none'}} onFocus={e=>e.target.style.borderColor='#1a1a18'} onBlur={e=>e.target.style.borderColor='#c8c4bc'}/>
        </div>
        <Btn full disabled={loading} style={{marginBottom:mode==='register'?'0.5rem':'0.875rem'}}>
          {loading?<span style={{display:'flex',alignItems:'center',gap:8}}><Spin/>{mode==='login'?t('authSubmitLogin'):t('authSubmitRegister')}</span>:(mode==='login'?t('authSubmitLogin'):t('authSubmitRegister'))}
        </Btn>
        {mode==='register'&&<p style={{fontSize:11,color:'#aaa8a0',lineHeight:1.5,marginBottom:'0.875rem',textAlign:'center'}}>{t('authConsentText')}</p>}
      </form>
      <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setInfoMsg('');}} style={{background:'none',border:'none',color:'#888880',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',padding:0,textDecoration:'underline',textDecorationColor:'#c8c4bc',width:'100%',textAlign:'center'}}>
        {mode==='login'?t('authSwitchToRegister'):t('authSwitchToLogin')}
      </button>
    </div>
  </div>;
}

/* ── PWA BANNERS ── */
function InstallBanner({t,onInstall,onDismiss}){return<div style={{background:'#1a1a18',color:'#fafaf8',padding:'12px 1.5rem',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}><span style={{fontSize:18}}>📲</span><div style={{flex:1,minWidth:150}}><div style={{fontSize:13}}>{t('installApp')}</div><div style={{fontSize:11,opacity:0.7}}>{t('installDesc')}</div></div><div style={{display:'flex',gap:8}}><Btn onClick={()=>{window.ymGoal('install_app_click');onInstall();}} variant="success" small>{t('installBtn')}</Btn><Btn onClick={onDismiss} variant="ghost" small style={{color:'#aaa'}}>{t('installDismiss')}</Btn></div></div>;}
function UpdateBanner({t,onUpdate}){return<div style={{background:'#fff8e1',borderBottom:'1px solid #ffe082',padding:'10px 1.5rem',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}><span style={{fontSize:16}}>🔄</span><div style={{flex:1,fontSize:13,color:'#795548'}}><b style={{fontWeight:400}}>{t('updateAvailable')}</b> — {t('updateDesc')}</div><Btn onClick={onUpdate} small style={{background:'#f57f17',color:'#fff',border:'none'}}>{t('updateBtn')}</Btn></div>;}
function OfflineBadge({t}){return<div style={{background:'#f5f5f5',borderBottom:'1px solid #e0e0e0',padding:'6px 1.5rem',display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#888880'}}><span style={{width:7,height:7,borderRadius:'50%',background:'#bdbdbd',display:'inline-block'}}/>{t('offlineBadge')} — данные из кеша</div>;}

/* ── NAV ── */
function Nav({season,onLogoClick,onSeasonInfoClick,onSettings,onAuthOpen,user,t,s,isOnline,installed}){
  return<nav style={{borderBottom:'1px solid #e8e4dc',padding:'0.75rem 1.5rem',display:'flex',alignItems:'center',gap:10,background:'#fff',position:'sticky',top:0,zIndex:10}}>
    <div onClick={()=>{window.ymGoal('header_logo_click');onLogoClick();}} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
      <div style={{width:28,height:28,borderRadius:'8px',background:'#1a1a18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🎨</div>
      <span style={{fontSize:17,fontWeight:400,letterSpacing:'-0.01em'}}>Chromé</span>
    </div>
    <span style={{fontSize:11,color:'#aaa8a0',background:'#f5f2eb',borderRadius:4,padding:'2px 7px',letterSpacing:'0.03em'}}>{installed?t('standaloneMode'):t('offline')}</span>
    {!isOnline&&<span style={{fontSize:11,color:'#b71c1c',background:'#fce4ec',borderRadius:4,padding:'2px 7px'}}>offline</span>}
    <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
      {season&&<span onClick={()=>{window.ymGoal('header_color_type_click');onSeasonInfoClick&&onSeasonInfoClick();}} style={{fontSize:12,color:'#888880',fontStyle:'italic',display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'4px 8px',borderRadius:6,transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f5f2eb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <span style={{width:8,height:8,borderRadius:'50%',background:window.SEASONS[season].accent,display:'inline-block'}}/>{s(window.SEASONS[season].name)}
      </span>}
      {!user&&<>
        <button onClick={()=>{window.ymGoal('header_login_click');onAuthOpen('login');}} style={{background:'none',border:'none',color:'#888880',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',padding:'4px 8px',borderRadius:6,transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f5f2eb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{t('authLogin')}</button>
        <button onClick={()=>{window.ymGoal('header_register_click');onAuthOpen('register');}} style={{background:'#1a1a18',border:'none',color:'#fafaf8',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',padding:'5px 12px',borderRadius:6,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{t('authRegister')}</button>
      </>}
      <span onClick={onSettings} style={{cursor:'pointer',fontSize:16,padding:'4px 6px',borderRadius:6,transition:'background 0.15s',color:'#888880'}} onMouseEnter={e=>e.currentTarget.style.background='#f5f2eb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>⚙️</span>
    </div>
  </nav>;
}

/* ── AUTH PROMO ── */
function HomeAuthPromo({onAuthOpen,t}){
  return<div style={{marginTop:'1.5rem',borderRadius:12,border:'1px solid #e8e4dc',background:'#fafaf8',padding:'1.25rem',display:'flex',flexDirection:'column',gap:10}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
      <span style={{fontSize:20,lineHeight:1,flexShrink:0}}>☁️</span>
      <div>
        <div style={{fontSize:14,fontWeight:400,color:'#1a1a18',marginBottom:4,lineHeight:1.4}}>{t('homeAuthPromoTitle')}</div>
        <div style={{fontSize:13,color:'#888880',lineHeight:1.6}}>{t('homeAuthPromoText')}</div>
      </div>
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button onClick={()=>{window.ymGoal('home_promo_login_click');onAuthOpen('login');}} style={{background:'none',border:'1px solid #c8c4bc',borderRadius:6,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',color:'#555550',transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#1a1a18'} onMouseLeave={e=>e.currentTarget.style.borderColor='#c8c4bc'}>{t('homeAuthPromoLogin')}</button>
      <button onClick={()=>{window.ymGoal('home_promo_register_click');onAuthOpen('register');}} style={{background:'#1a1a18',border:'none',borderRadius:6,padding:'7px 16px',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',color:'#fafaf8',transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{t('homeAuthPromoRegister')}</button>
    </div>
  </div>;
}

/* ── SCREENS ── */
function Welcome({onStart,t}){
  return<div className="fade" style={{maxWidth:420,margin:'0 auto',padding:'4rem 1.5rem 3rem',textAlign:'center'}}>
    <div style={{width:64,height:64,borderRadius:'22px',background:'#1a1a18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,margin:'0 auto 1.5rem',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>🎨</div>
    <h1 style={{fontSize:32,fontWeight:400,marginBottom:8,letterSpacing:'-0.02em'}}>Chromé</h1>
    <p style={{fontSize:16,color:'#666660',marginBottom:6,lineHeight:1.6,fontStyle:'italic'}}>{t('appTagline')}</p>
    <p style={{fontSize:14,color:'#aaa8a0',marginBottom:'2rem',lineHeight:1.7}}>{t('appDesc')}</p>
    <div style={{marginBottom:'1.25rem'}}><Btn onClick={()=>{window.ymGoal('welcomepage_start_click');onStart();}} full>{t('getStarted')}</Btn></div>
    <div style={{background:'#F5F3EF',borderRadius:14,padding:'16px 18px',textAlign:'left'}}>
      {[['🌸',t('feat1')],['📸',t('feat2')],['🔒',t('feat4')]].map(([ic,tx],i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:12,fontSize:13,color:'#555550',paddingTop:i>0?10:0,marginTop:i>0?10:0,borderTop:i>0?'1px solid #E8E4DC':'none'}}>
          <span style={{fontSize:15,minWidth:20,flexShrink:0}}>{ic}</span><span style={{lineHeight:1.5}}>{tx}</span>
        </div>
      ))}
    </div>
  </div>;
}

function PromoBanner({s}){
  const cfg=window.PROMO_BANNER;if(!cfg||!cfg.enabled)return null;
  return<div onClick={()=>{window.ymGoal('home_promobanner_click');window.open(cfg.url,'_blank','noopener,noreferrer');}} style={{cursor:'pointer',borderRadius:16,background:cfg.gradient,padding:'1.1rem 1.25rem',display:'flex',alignItems:'center',gap:14,marginTop:'1.25rem',boxShadow:'0 4px 20px rgba(160,120,210,0.18)',transition:'transform 0.2s,box-shadow 0.2s',userSelect:'none'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(160,120,210,0.28)';}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(160,120,210,0.18)';}}>
    {cfg.lottieUrl?<dotlottie-wc src={cfg.lottieUrl} autoplay loop style={{width:'72px',height:'72px',flexShrink:0,pointerEvents:'none'}}/>:<div style={{fontSize:44,lineHeight:1,flexShrink:0}}>{cfg.emoji}</div>}
    <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:'#2e1a4a',marginBottom:4,lineHeight:1.35}}>{s(cfg.title)}</div><div style={{fontSize:12,color:'#5a4070',lineHeight:1.55,opacity:0.85}}>{s(cfg.subtitle)}</div></div>
    <div style={{fontSize:18,color:'#8a60b0',flexShrink:0,opacity:0.7}}>→</div>
  </div>;
}

function HomePage({season,history,onAnalyze,onHistory,onChangeType,onSeasonInfo,onAuthOpen,user,t,s}){
  const ss=window.SEASONS[season];
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem 5rem'}}>
    <div style={{marginBottom:'1.5rem'}}><p style={{fontSize:13,color:'#888880',marginBottom:4}}>{t('homeSubtitle')}</p><h1 style={{fontSize:28,fontWeight:400,letterSpacing:'-0.02em'}}>{t('homeTitle')}</h1></div>
    <div onClick={()=>{window.ymGoal('color_type_details_click');onSeasonInfo();}} style={{cursor:'pointer'}}>
      <Card style={{background:ss.bg,border:'2px solid '+ss.accent+'60',marginBottom:'1.25rem',padding:'1.25rem',transition:'box-shadow 0.15s,transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px '+ss.accent+'30';e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.75rem',flexWrap:'wrap',gap:8}}>
          <div><div style={{fontSize:22,fontWeight:400,marginBottom:2,display:'flex',alignItems:'center',gap:8}}>{s(ss.name)}<span style={{fontSize:12,color:ss.accent,background:ss.bg,border:'1px solid '+ss.accent+'40',borderRadius:12,padding:'2px 10px'}}>{t('homeSeasonHint')}</span></div><div style={{fontSize:13,color:'#888880',fontStyle:'italic'}}>{s(ss.label)}</div></div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}>{ss.swatches.map(c=><div key={c} style={{width:22,height:22,borderRadius:4,background:c}}/>)}</div>
        </div>
        <div style={{fontSize:13,color:'#666660',fontStyle:'italic',marginBottom:'0.75rem',lineHeight:1.6}}>{s(ss.tagline)}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><div style={{fontSize:10,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('homeBestColors')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(ss.best)}</div></div>
          <div><div style={{fontSize:10,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('homeAvoid')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(ss.avoid)}</div></div>
        </div>
      </Card>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <button onClick={onAnalyze} style={{background:'#EAE6DF',border:'2px solid #1a1a18',borderRadius:10,padding:'1rem 1.25rem',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:14,fontFamily:'Georgia,serif',transition:'opacity 0.15s',boxShadow:'0 2px 8px rgba(26,26,24,0.10)'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        <span style={{fontSize:22}}>🪄</span><div style={{flex:1}}><div style={{fontSize:15,marginBottom:2}}>{t('homeAnalyze')}</div><div style={{fontSize:12,opacity:0.6}}>{t('analyzeDesc')}</div></div><span style={{fontSize:18,opacity:0.5}}>→</span>
      </button>
      {history.length>0&&<button onClick={onHistory} style={{background:'#fff',border:'1px solid #e8e4dc',borderRadius:10,padding:'1rem 1.25rem',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:14,fontFamily:'Georgia,serif',transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        <span style={{fontSize:22}}>🗂</span><div style={{flex:1}}><div style={{fontSize:15,marginBottom:2}}>{t('homeHistory')}</div><div style={{fontSize:12,opacity:0.6}}>{history.length} {window.LANG==='ru'?'анализов':'analyses'}</div></div><span style={{fontSize:18,opacity:0.4}}>→</span>
      </button>}
      <button onClick={()=>{window.ymGoal('change_color_type_click');onChangeType();}} style={{background:'#fff',border:'1px solid #e8e4dc',borderRadius:10,padding:'1rem 1.25rem',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:14,fontFamily:'Georgia,serif',transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
        <span style={{fontSize:22}}>🎨</span><div style={{flex:1}}><div style={{fontSize:15}}>{t('homeChangeType')}</div></div><span style={{fontSize:18,opacity:0.4}}>→</span>
      </button>
    </div>
    <PromoBanner s={s}/>
    {!user&&<HomeAuthPromo onAuthOpen={onAuthOpen} t={t}/>}
  </div>;
}

function SeasonInfo({seasonId,onBack,t,s}){
  const season=window.SEASONS[seasonId];
  const Sec=({icon,title,children,style})=><Card style={{marginBottom:'1rem',...(style||{})}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.75rem'}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em'}}>{title}</span></div>{children}</Card>;
  const Tag=({text,color,bg})=><span style={{background:bg||'#f5f2eb',color:color||'#555550',border:'1px solid '+(color||'#ccc')+'60',borderRadius:20,padding:'2px 9px',fontSize:11,display:'inline-block',margin:'2px'}}>{text}</span>;
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem 5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <Card style={{background:season.bg,border:'2px solid '+season.accent+'50',marginBottom:'1rem',marginTop:'1rem',padding:'1.25rem'}}>
      <div style={{fontSize:28,fontWeight:400,marginBottom:4}}>{s(season.name)}</div>
      <div style={{fontSize:14,color:'#666660',marginBottom:'1rem',fontStyle:'italic'}}>{s(season.label)} · {s(season.tagline)}</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{season.swatches.map(c=><div key={c} style={{width:26,height:26,borderRadius:4,background:c}}/>)}</div>
    </Card>
    <Card style={{marginBottom:'1rem',borderLeft:'3px solid '+season.accent}}>
      <Lbl>{t('seasonProfile')}</Lbl>
      <p style={{fontSize:13,color:'#444440',lineHeight:1.7,marginBottom:'1rem'}}>{s(season.description)}</p>
      <div style={{marginBottom:'0.75rem'}}><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{t('seasonKeywords')}</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{s(season.keywords).map(kw=><span key={kw} style={{background:season.bg,color:season.accent,border:'1px solid '+season.accent+'50',borderRadius:20,padding:'3px 12px',fontSize:12}}>{kw}</span>)}</div></div>
      <div style={{marginBottom:'0.75rem'}}><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('seasonMakeup')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(season.makeup)}</div></div>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('seasonNeutral')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(season.neutrals)}</div></div>
    </Card>
    <Card style={{marginBottom:'1rem'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('best')}</div><div style={{fontSize:12,color:'#2e7d32',lineHeight:1.6}}>{s(season.best)}</div></div>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('avoid')}</div><div style={{fontSize:12,color:'#b71c1c',lineHeight:1.6}}>{s(season.avoid)}</div></div>
    </div></Card>
    {season.contrast&&<Sec icon="👁" title={t('contrastBlock')}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.6rem'}}><span style={{fontSize:12,color:'#888880'}}>{t('contrastLevelLabel')}:</span><span style={{background:season.accent,color:'#fff',borderRadius:12,padding:'2px 10px',fontSize:12}}>{s(season.contrast.level)}</span></div><p style={{fontSize:12,color:'#444440',lineHeight:1.6,marginBottom:'0.5rem'}}>{s(season.contrast.desc)}</p><div style={{background:season.bg,borderRadius:6,padding:'8px 10px',fontSize:12,color:'#555550',lineHeight:1.6}}>💡 {s(season.contrast.tips)}</div></Sec>}
    {season.styles&&<Sec icon="👗" title={t('stylesBlock')}><div style={{display:'flex',flexDirection:'column',gap:8}}>{season.styles.map((st,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}><div style={{width:6,height:6,borderRadius:'50%',background:season.accent,marginTop:5,flexShrink:0}}/><div><div style={{fontSize:13,color:'#1a1a18'}}>{s(st.name)}</div><div style={{fontSize:12,color:'#888880',lineHeight:1.5}}>{s(st.desc)}</div></div></div>)}</div></Sec>}
    {season.fabrics&&<Sec icon="🧵" title={t('fabricsBlock')}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{t('fabricsPrefer')}</div><div style={{display:'flex',flexWrap:'wrap'}}>{season.fabrics.prefer.map((f,i)=><Tag key={i} text={s(f.name)} color='#2e7d32' bg='#e8f5e9'/>)}</div></div><div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{t('fabricsAvoid')}</div><div style={{display:'flex',flexWrap:'wrap'}}>{season.fabrics.avoid.map((f,i)=><Tag key={i} text={s(f.name)} color='#b71c1c' bg='#fce4ec'/>)}</div></div></div></Sec>}
    {season.silhouettes&&<Sec icon="✂️" title={t('silhouettesBlock')}><div style={{display:'flex',flexDirection:'column',gap:6}}>{[[t('silhouetteLines'),s(season.silhouettes.lines)],[t('silhouetteFit'),s(season.silhouettes.fit)],[t('silhouetteExamples'),s(season.silhouettes.examples)]].map(pair=><div key={pair[0]} style={{fontSize:12,color:'#555550',lineHeight:1.6}}><span style={{color:'#aaa8a0'}}>{pair[0]}: </span>{pair[1]}</div>)}</div></Sec>}
    {season.jewelry&&<Sec icon="💍" title={t('jewelryBlock')}><div style={{display:'flex',flexDirection:'column',gap:6}}>{[[t('jewelryMetals'),s(season.jewelry.metals)],[t('jewelrySize'),s(season.jewelry.size)],[t('jewelryTexture'),s(season.jewelry.texture)]].map(pair=><div key={pair[0]} style={{fontSize:12,color:'#555550',lineHeight:1.6}}><span style={{color:'#aaa8a0'}}>{pair[0]}: </span><b style={{fontWeight:400,color:'#1a1a18'}}>{pair[1]}</b></div>)}</div></Sec>}
  </div>;
}

function Setup({onManual,onPhoto,onBack,t}){
  return<div className="fade" style={{maxWidth:420,margin:'0 auto',padding:'2.5rem 1.5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <h2 style={{fontSize:22,fontWeight:400,margin:'12px 0 6px'}}>{t('setupTitle')}</h2>
    <p style={{fontSize:13,color:'#888880',marginBottom:'1.5rem',lineHeight:1.6}}>{t('setupDesc')}</p>
    {[['📸',t('autoDetect'),t('autoDetectDesc'),onPhoto,'auto_detect_click'],['🎨',t('manualSelect'),t('manualSelectDesc'),onManual,'manual_select_click']].map(([ico,tx,desc,fn,goal])=>(
      <button key={goal} onClick={()=>{window.ymGoal(goal);fn();}} style={{width:'100%',background:'#fff',border:'1px solid #e8e4dc',borderRadius:10,padding:'1.25rem',cursor:'pointer',textAlign:'left',marginBottom:10,display:'flex',gap:14,alignItems:'flex-start',fontFamily:'Georgia,serif'}}>
        <span style={{fontSize:22,minWidth:28}}>{ico}</span>
        <div><div style={{fontWeight:400,fontSize:15,marginBottom:4,color:'#1a1a18'}}>{tx}</div><div style={{fontSize:12,color:'#888880'}}>{desc}</div></div>
      </button>
    ))}
  </div>;
}

function ManualSelect({onSelect,onBack,t,s}){
  const[sel,setSel]=useState(null);const ss=sel?window.SEASONS[sel]:null;
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2.5rem 1.5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <h2 style={{fontSize:22,fontWeight:400,margin:'12px 0 6px'}}>{t('chooseTypeTitle')}</h2>
    <p style={{fontSize:13,color:'#888880',marginBottom:'1.25rem'}}>{t('chooseTypeDesc')}</p>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
      {Object.values(window.SEASONS).map(season=>(
        <button key={season.id} onClick={()=>{window.ymGoal('select_'+season.id+'_click');setSel(season.id);}} style={{background:sel===season.id?season.bg:'#fff',border:sel===season.id?'2px solid '+season.accent:'1px solid #e8e4dc',borderRadius:10,padding:'1rem',cursor:'pointer',textAlign:'left',transition:'all 0.15s',fontFamily:'Georgia,serif'}}>
          <div style={{fontWeight:400,fontSize:15,marginBottom:2,color:'#1a1a18'}}>{s(season.name)}</div>
          <div style={{fontSize:11,color:'#888880',marginBottom:10}}>{s(season.label)}</div>
          <div style={{display:'flex',gap:5}}>{season.swatches.slice(0,4).map(c=><div key={c} style={{width:18,height:18,borderRadius:3,background:c}}/>)}</div>
        </button>
      ))}
    </div>
    {ss&&<Card style={{marginBottom:'1rem',background:ss.bg,border:'1px solid '+ss.accent+'30'}}><div style={{fontStyle:'italic',color:'#555550',marginBottom:4,fontSize:14}}>{s(ss.tagline)}</div><div style={{fontSize:12,color:'#888880'}}>{t('best')}: {s(ss.best)}</div></Card>}
    <Btn onClick={()=>{if(sel){window.ymGoal('confirm_color_type_click');onSelect(sel);}}} full disabled={!sel}>{t('confirm')} {sel?s(window.SEASONS[sel].name):''} {t('type')}</Btn>
  </div>;
}

function PhotoScreen({onDetected,onBack,setErr,t,lang}){
  const{imgObj,converting,fileErr,load}=useFileLoader(t,lang);const[loading,setLoading]=useState(false);
  const detect=async()=>{if(!imgObj)return;setLoading(true);try{const r=await window.detectColorType(imgObj);onDetected(r);}catch(e){setErr(t('detectionFailed'));}setLoading(false);};
  return<div className="fade" style={{maxWidth:420,margin:'0 auto',padding:'2.5rem 1.5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <h2 style={{fontSize:22,fontWeight:400,margin:'12px 0 6px'}}>{t('uploadPhotoTitle')}</h2>
    <p style={{fontSize:13,color:'#888880',marginBottom:'0.5rem',lineHeight:1.5}}>{t('uploadPhotoDesc')}</p>
    <div style={{background:'#f5f2eb',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#888880',marginBottom:'0.5rem'}}>{t('photoTip')}</div>
    <div style={{background:'#f0f4fa',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#7A96B8',marginBottom:'1rem',display:'flex',alignItems:'center',gap:6}}><span>📱</span><span>JPG · PNG · HEIC — {t('uploadSelfieHintConvert')}</span></div>
    <Drop onSelect={load} preview={imgObj&&imgObj.preview} label={t('uploadSelfie')} sub="JPG · PNG · HEIC" converting={converting}/>
    {fileErr&&<div style={{fontSize:12,color:'#b71c1c',marginTop:8,lineHeight:1.5}}>{fileErr}</div>}
    <div style={{marginTop:'1rem'}}><Btn onClick={detect} full disabled={!imgObj||loading||!!converting}>{loading?<span style={{display:'flex',alignItems:'center',gap:8}}><Spin/>{t('detecting')}</span>:t('detectBtn')}</Btn></div>
  </div>;
}

function Detected({d,onConfirm,onOverride,onBack,t,s}){
  const season=window.SEASONS[d.color_type];const conf=Math.round(d.confidence_score*100);
  const loc=v=>({warm:t('warm'),cool:t('cool'),neutral:t('neutral'),light:t('light'),medium:t('medium'),dark:t('dark'),olive:t('olive'),high:t('high'),low:t('low')}[v]||v);
  const ls=o=>typeof o==='object'?s(o):o;
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem 5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <Card style={{background:season.bg,border:'1px solid '+season.accent+'40',marginBottom:'1rem',marginTop:'1rem'}}>
      <Lbl>{t('detectedType')}</Lbl>
      <div style={{fontSize:28,fontWeight:400,marginBottom:4}}>{s(season.name)}</div>
      <div style={{fontSize:14,color:'#666660',marginBottom:'1rem',fontStyle:'italic'}}>{s(season.label)} · {s(season.tagline)}</div>
      <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>{season.swatches.map(c=><div key={c} style={{width:26,height:26,borderRadius:4,background:c}}/>)}</div>
      <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{flex:1,height:4,background:'#00000015',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:conf+'%',background:season.accent,borderRadius:2}}/></div><span style={{fontSize:12,color:'#888880',whiteSpace:'nowrap'}}>{conf}{t('confidence')}</span></div>
    </Card>
    <Card style={{marginBottom:'1rem'}}><Lbl>{t('analysisDetails')}</Lbl>
      <div style={{fontSize:13,color:'#555550',lineHeight:1.8}}>
        <div>{t('skinTone')}: <b style={{fontWeight:400,color:'#1a1a18'}}>{loc(d.skin_tone)}</b> &nbsp;·&nbsp; {t('undertone')}: <b style={{fontWeight:400,color:'#1a1a18'}}>{loc(d.undertone)}</b></div>
        <div>{t('hair')}: <b style={{fontWeight:400,color:'#1a1a18'}}>{ls(d.hair_color)}</b> &nbsp;·&nbsp; {t('eyes')}: <b style={{fontWeight:400,color:'#1a1a18'}}>{ls(d.eye_color)}</b></div>
        <div>{t('contrast')}: <b style={{fontWeight:400,color:'#1a1a18'}}>{loc(d.contrast_level)}</b></div>
      </div>
    </Card>
    <Card style={{marginBottom:'1rem',borderLeft:'3px solid '+season.accent}}><Lbl>{t('seasonProfile')}</Lbl>
      <p style={{fontSize:13,color:'#444440',lineHeight:1.7,marginBottom:'1rem'}}>{s(season.description)}</p>
      <div style={{marginBottom:'0.75rem'}}><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{t('seasonKeywords')}</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{s(season.keywords).map(kw=><span key={kw} style={{background:season.bg,color:season.accent,border:'1px solid '+season.accent+'50',borderRadius:20,padding:'3px 12px',fontSize:12}}>{kw}</span>)}</div></div>
      <div style={{marginBottom:'0.75rem'}}><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('seasonMakeup')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(season.makeup)}</div></div>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('seasonNeutral')}</div><div style={{fontSize:12,color:'#555550',lineHeight:1.6}}>{s(season.neutrals)}</div></div>
    </Card>
    <Card style={{marginBottom:'1rem'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('best')}</div><div style={{fontSize:12,color:'#2e7d32',lineHeight:1.6}}>{s(season.best)}</div></div>
      <div><div style={{fontSize:11,color:'#aaa8a0',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{t('avoid')}</div><div style={{fontSize:12,color:'#b71c1c',lineHeight:1.6}}>{s(season.avoid)}</div></div>
    </div></Card>
    <div style={{background:'#fff8e1',border:'1px solid #ffe082',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#795548',marginBottom:'1rem'}}>{t('approxWarning')}</div>
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <Btn onClick={()=>{window.ymGoal('confirm_color_type_click');onConfirm(d.color_type);}} full>{t('confirmType')}</Btn>
      <Btn onClick={onOverride} variant="secondary" full>{t('chooseDiff')}</Btn>
    </div>
  </div>;
}

function AnalyzePage({season,onAnalyze,onBack,t,s,lang}){
  const ss=window.SEASONS[season];const{imgObj,converting,fileErr,load}=useFileLoader(t,lang);
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem'}}>
    <Btn onClick={onBack} variant="ghost">{t('back')}</Btn>
    <Card style={{background:ss.bg,border:'1px solid '+ss.accent+'30',margin:'1rem 0'}}><div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><div style={{display:'flex',gap:5}}>{ss.swatches.slice(0,5).map(c=><div key={c} style={{width:18,height:18,borderRadius:3,background:c}}/>)}</div><div style={{flex:1,minWidth:120}}><span style={{fontSize:14,fontWeight:400}}>{s(ss.name)}</span><span style={{fontSize:12,color:'#888880',marginLeft:6,fontStyle:'italic'}}>{s(ss.label)}</span></div></div></Card>
    <h2 style={{fontSize:20,fontWeight:400,marginBottom:6}}>{t('analyzeTitle')}</h2>
    <p style={{fontSize:13,color:'#888880',marginBottom:'0.5rem',lineHeight:1.5}}>{t('analyzeDesc')}</p>
    <div style={{background:'#f0f4fa',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#7A96B8',marginBottom:'1rem',display:'flex',alignItems:'center',gap:6}}><span>📱</span><span>JPG · PNG · HEIC — {t('uploadSelfieHintConvert')}</span></div>
    <Drop onSelect={load} preview={imgObj&&imgObj.preview} label={t('uploadClothing')} sub="JPG · PNG · HEIC" converting={converting}/>
    {fileErr&&<div style={{fontSize:12,color:'#b71c1c',marginTop:8,lineHeight:1.5}}>{fileErr}</div>}
    <div style={{marginTop:'1rem'}}><Btn onClick={()=>imgObj&&onAnalyze(imgObj,imgObj.preview)} full disabled={!imgObj||!!converting}>{t('analyzeBtn')}</Btn></div>
  </div>;
}

function Analyzing({t}){return<div style={{maxWidth:400,margin:'0 auto',padding:'6rem 1.5rem',textAlign:'center'}}><div style={{marginBottom:'1.5rem',display:'flex',justifyContent:'center'}}><Spin/></div><div style={{fontSize:18,fontWeight:400,marginBottom:8}}>{t('analyzingTitle')}</div><div style={{fontSize:13,color:'#888880',fontStyle:'italic'}}>{t('analyzingDesc')}</div></div>;}

function Result({result,preview,season,onBack,t,s,lang}){
  const ss=window.SEASONS[season];
  const colorName=window.COLOR_NAMES[result.color_key]?s(window.COLOR_NAMES[result.color_key]):result.color_key;
  const cap=colorName.charAt(0).toUpperCase()+colorName.slice(1);
  const sn=s(result.season_name),tl=t(result.color_temperature),sl=t(result.saturation),bf=s(result.season_best)||'';
  const expl={fits:lang==='ru'?`${cap} прекрасно вписывается в палитру «${sn}» — ${tl} температура и ${sl} насыщенность подчёркивают вашу внешность.`:`${cap} sits beautifully within your ${sn} palette — the ${tl} temperature and ${sl} saturation complement your coloring.`,neutral:lang==='ru'?`${cap} — рабочий выбор для типа «${sn}», не в идеальном диапазоне. Добавьте акценты своей палитры.`:`${cap} is workable for your ${sn} type, though not ideal. Pair with your signature colors.`,not_fits:lang==='ru'?`${cap} конфликтует с палитрой «${sn}». ${tl} температура работает против вашей внешности.`:`${cap} clashes with your ${sn} palette. The ${tl} temperature works against your coloring.`};
  const recs={fits:lang==='ru'?'Носите как основной предмет — подчёркивает вашу естественную красоту.':'Wear as a main piece — it enhances your natural glow.',neutral:lang==='ru'?`Используйте как базу, добавив аксессуары палитры «${sn}».`:`Use as a base and add ${sn}-palette accessories.`,not_fits:lang==='ru'?`Попробуйте заменить на: ${bf.split(',').slice(0,2).join(' или ')}.`:`Try replacing with: ${bf.split(',').slice(0,2).join(' or ')}.`};
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem'}}>
    <div style={{marginBottom:'1rem'}}><Btn onClick={()=>{window.ymGoal('back_click');onBack();}} variant="ghost">{t('toDashboard')}</Btn></div>
    <div style={{display:'grid',gridTemplateColumns:'100px 1fr',gap:'1rem',marginBottom:'1.5rem',alignItems:'start'}}>
      {preview?<img src={preview} style={{width:'100%',aspectRatio:'3/4',objectFit:'cover',borderRadius:8,border:'1px solid #e8e4dc'}} alt="clothing"/>:<ImagePlaceholder size={100}/>}
      <div>
        <div style={{marginBottom:10}}><Chip verdict={result.verdict} t={t}/></div>
        <div style={{fontSize:16,fontWeight:400,marginBottom:4,color:'#1a1a18',textTransform:'capitalize'}}>{colorName}</div>
        <div style={{fontSize:11,color:'#888880',marginBottom:'0.75rem',textTransform:'capitalize',lineHeight:1.6}}>{s(result.category)} · {t(result.color_temperature)} · {t(result.brightness)} · {t(result.saturation)}</div>
        <Score n={result.color_match_score} t={t}/>
      </div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:'1.25rem'}}>
      {[[t('analysisLabel'),expl[result.verdict]],[t('recommendLabel'),recs[result.verdict]]].map(([label,text])=>(
        <Card key={label}><Lbl>{label}</Lbl><div style={{fontSize:13,lineHeight:1.7,color:'#555550',fontStyle:label===t('analysisLabel')?'italic':'normal'}}>{text}</div></Card>
      ))}
      <Card style={{background:ss.bg,border:'1px solid '+ss.accent+'30'}}>
        <Lbl>{t('yourPalette')} — {s(ss.name)}</Lbl>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{ss.swatches.map(c=><div key={c} style={{width:28,height:28,borderRadius:5,background:c}}/>)}</div>
      </Card>
    </div>
    <Btn onClick={()=>{window.ymGoal('analyze_more_click');onBack();}} full>{t('analyzeAnother')}</Btn>
  </div>;
}

function History({history,onBack,onClear,onClearRemote,t,s,user}){
  const hasPlaceholders=history.some(item=>!(item.preview&&item.preview.startsWith('data:')));
  return<div className="fade" style={{maxWidth:480,margin:'0 auto',padding:'2rem 1.5rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
      <div><Btn onClick={()=>{window.ymGoal('back_click');onBack();}} variant="ghost">{t('back')}</Btn><h2 style={{fontSize:22,fontWeight:400,marginTop:8}}>{t('historyTitle')}</h2></div>
      {history.length>0&&<Btn onClick={()=>user?onClearRemote():onClear()} variant="secondary" small>{t('clearAll')}</Btn>}
    </div>
    {hasPlaceholders&&history.length>0&&(
      <div style={{background:'#f5f2eb',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#888880',marginBottom:'1rem',lineHeight:1.6,display:'flex',gap:8,alignItems:'flex-start'}}>
        <span style={{flexShrink:0,fontSize:14}}>🔒</span><span>{t('historyNoPhotoNote')}</span>
      </div>
    )}
    {history.length===0
      ?<div style={{textAlign:'center',padding:'4rem',color:'#aaa',fontSize:14,fontStyle:'italic'}}>{t('noHistory')}</div>
      :<div style={{display:'flex',flexDirection:'column',gap:10}}>
        {history.map((item,idx)=>{
          const cn=window.COLOR_NAMES[item.result&&item.result.color_key]?s(window.COLOR_NAMES[item.result.color_key]):(item.result&&item.result.color_key)||'—';
          const hasPreview=item.preview&&item.preview.startsWith('data:');
          return<Card key={item.id||idx} style={{display:'grid',gridTemplateColumns:'56px 1fr auto',gap:12,alignItems:'center'}}>
            {hasPreview?<img src={item.preview} style={{width:56,height:56,objectFit:'cover',borderRadius:5,border:'1px solid #e8e4dc'}} alt=""/>:<ImagePlaceholder size={56}/>}
            <div><div style={{fontSize:14,fontWeight:400,marginBottom:2,color:'#1a1a18',textTransform:'capitalize'}}>{cn}</div><div style={{fontSize:11,color:'#888880',marginBottom:6,textTransform:'capitalize'}}>{item.result&&s(item.result.category)}</div><Score n={(item.result&&item.result.color_match_score)||0} t={t}/></div>
            <Chip verdict={(item.result&&item.result.verdict)||'neutral'} t={t}/>
          </Card>;
        })}
      </div>}
  </div>;
}

function Settings({onBack,onClearAll,onAuthOpen,user,onLogout,onDeleteProfile,t,lang}){
  const sid=window.SessionManager.getId();
  const[cleared,setCleared]=useState(false);
  const[showDeleteModal,setShowDeleteModal]=useState(false);
  const[deletingProfile,setDeletingProfile]=useState(false);

  const handleClearLocal=()=>{
    if(window.confirm(t('clearDataConfirm'))){
      window.ymGoal('clear_local_data_click');
      window.SessionManager.clearLocalOnly();
      setCleared(true);
      setTimeout(()=>{setCleared(false);onClearAll();},1200);
    }
  };

  const handleDeleteProfile=async()=>{
    setShowDeleteModal(false);setDeletingProfile(true);
    try{
      const u=window.AuthManager.getUser();
      if(u){await window.DBManager.deleteProfile(u.id);await window.AuthManager.deleteAuthUser();}
      await window.AuthManager.signOut();
      window.SessionManager.clearAll();
      window.ymGoal('delete_profile_click');
      onDeleteProfile();
    }catch(e){console.error('Delete profile error:',e);}
    setDeletingProfile(false);
  };

  return<>
    {showDeleteModal&&<DeleteConfirmModal onConfirm={handleDeleteProfile} onCancel={()=>setShowDeleteModal(false)} t={t}/>}
    <div className="fade" style={{maxWidth:420,margin:'0 auto',padding:'2.5rem 1.5rem'}}>
      <Btn onClick={()=>{window.ymGoal('back_click');onBack();}} variant="ghost">{t('back')}</Btn>
      <h2 style={{fontSize:22,fontWeight:400,margin:'12px 0 20px'}}>{t('settingsTitle')}</h2>

      {!user?(
        <Card style={{marginBottom:'1.25rem',borderLeft:'3px solid #c8c4bc'}}>
          <div style={{fontSize:13,color:'#666660',lineHeight:1.7,marginBottom:'1rem',fontStyle:'italic'}}>{t('authValueProp')}</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Btn onClick={()=>{window.ymGoal('settings_login_click');onAuthOpen('login');}} variant="secondary" small>{t('authLogin')}</Btn>
            <Btn onClick={()=>{window.ymGoal('settings_register_click');onAuthOpen('register');}} small>{t('authRegister')}</Btn>
          </div>
        </Card>
      ):(
        <Card style={{marginBottom:'1.25rem',borderLeft:'3px solid #a5d6a7'}}>
          <div style={{fontSize:12,color:'#2e7d32',marginBottom:6,display:'flex',alignItems:'center',gap:6}}><span>✓</span><span>{t('authLoggedInAs')}</span></div>
          <div style={{fontSize:13,color:'#1a1a18',marginBottom:'0.75rem',wordBreak:'break-all',fontFamily:'monospace',background:'#f5f2eb',borderRadius:6,padding:'6px 10px'}}>{user.email}</div>
          <div style={{fontSize:12,color:'#888880',marginBottom:'1rem',lineHeight:1.5}}>{t('authSyncNote')}</div>
          <Btn onClick={async()=>{window.ymGoal('logout_click');await onLogout();}} variant="secondary" small>{t('authLogout')}</Btn>
        </Card>
      )}

      <Card style={{marginBottom:'1rem'}}><Lbl>{t('appVersion')}</Lbl><div style={{fontSize:13,color:'#555550',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>Chromé</span><span style={{fontFamily:'monospace',background:'#f5f2eb',borderRadius:4,padding:'2px 8px',fontSize:12}}>1.26.4</span></div></Card>
      <Card style={{marginBottom:'1rem'}}><Lbl>{t('sessionId')}</Lbl><div style={{fontSize:11,color:'#888880',wordBreak:'break-all',fontFamily:'monospace',background:'#f5f2eb',borderRadius:6,padding:'8px 10px',lineHeight:1.6}}>{sid}</div><div style={{marginTop:10,fontSize:12,color:'#aaa8a0',display:'flex',alignItems:'flex-start',gap:6}}><span>🔒</span><span>{t('sessionInfo')}</span></div></Card>

      {!user&&(
        <Card style={{marginBottom:'1rem',border:'1px solid #f48fb1'}}>
          <Lbl>{t('clearData')}</Lbl>
          <p style={{fontSize:12,color:'#888880',marginBottom:'0.75rem',lineHeight:1.5}}>{t('clearDataDesc')}</p>
          {cleared?<div style={{fontSize:13,color:'#2e7d32',background:'#e8f5e9',borderRadius:6,padding:'8px 12px'}}>{t('clearDataDone')}</div>:<Btn onClick={handleClearLocal} variant="danger" full>{t('clearData')}</Btn>}
        </Card>
      )}

      <div style={{marginTop:'2rem',paddingTop:'1.5rem',borderTop:'1px solid #f0ede6',textAlign:'center'}}>
        {user&&(
          <div style={{marginBottom:'1rem'}}>
            <button onClick={()=>setShowDeleteModal(true)} disabled={deletingProfile} style={{background:'none',border:'none',color:'#c8c4bc',fontSize:12,cursor:'pointer',fontFamily:'Georgia,serif',padding:'4px 8px',borderRadius:4,transition:'color 0.15s',textDecoration:'underline',textDecorationColor:'#e8e4dc'}} onMouseEnter={e=>e.currentTarget.style.color='#b71c1c'} onMouseLeave={e=>e.currentTarget.style.color='#c8c4bc'}>
              {deletingProfile?<span style={{display:'inline-flex',alignItems:'center',gap:6}}><Spin/>{t('authDeleteProfile')}</span>:t('authDeleteProfile')}
            </button>
          </div>
        )}
        <div style={{fontSize:13,color:'#6B7280',lineHeight:1.6}}>
          {t('footerMade')}{' '}<a href="https://klimova-a.tilda.ws/welcome" target="_blank" rel="noopener noreferrer" style={{color:'#6B7280',textDecoration:'underline',textDecorationColor:'#c8c4bc',cursor:'pointer'}}>{t('footerContact')} →</a>
        </div>
      </div>
    </div>
  </>;
}

/* ══════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════ */
function App(){
  const{lang,t,s}=useLang();
  const{installable,installed,updateReady,isOnline,promptInstall,applyUpdate}=usePWA();
  const{user,authReady}=useAuth();
  const[showInstallBanner,setShowInstallBanner]=useState(false);
  const[authModal,setAuthModal]=useState(null);
  const[migrating,setMigrating]=useState(false);

  const savedProfile=window.SessionManager.loadProfile();
  const savedHistory=window.SessionManager.loadHistory();

  const[screen,setScreen]=useState(savedProfile?'home':'welcome');
  const[season,setSeason]=useState(savedProfile?savedProfile.season_id:null);
  const[history,setHistory]=useState(savedHistory);
  const[result,setResult]=useState(null);
  const[preview,setPreview]=useState(null);
  const[detection,setDetection]=useState(null);
  const[err,setErr]=useState(null);

  useEffect(()=>{if(installable&&!installed){const tm=setTimeout(()=>setShowInstallBanner(true),10000);return()=>clearTimeout(tm);}},[installable,installed]);
  useEffect(()=>{if(!installable)setShowInstallBanner(false);},[installable]);
  useEffect(()=>{
    const evts={welcome:'home_view_no_color_type',home:'home_view_with_color_type','season-info':'color_type_page_view',setup:'color_type_change_page_view',manual:'color_type_select_page_view',photo:'selfie_upload_page_view',analyze:'outfit_upload_page_view',result:'outfit_analysis_result_view',history:'history_page_view',settings:'settings_page_view'};
    const ev=evts[screen];if(ev)window.ymGoal(ev);
  },[screen]);

  useEffect(()=>{
    if(!user||!authReady)return;
    (async()=>{
      try{
        setMigrating(true);
        const profile=await window.DBManager.ensureProfile(user);
        if(profile&&profile.current_color_type){
          setSeason(profile.current_color_type);
          window.SessionManager.saveProfile(profile.current_color_type);
          setScreen('home');
        }
        const remoteHistory=await window.DBManager.loadOutfitHistory(user.id);
        if(remoteHistory&&remoteHistory.length>0){
          const converted=remoteHistory.map(row=>({
            id:row.id,created_at:row.created_at,preview:null,
            result:row.result_description?JSON.parse(row.result_description):null,
            localPreviewKey:row.local_preview_key
          }));
          const localHistory=window.SessionManager.loadHistory();
          const localMap={};
          localHistory.forEach(item=>{if(item.id)localMap[String(item.id)]=item;});
          const merged=converted.map(item=>{const local=localMap[String(item.id)];return local?{...item,preview:local.preview}:item;});
          setHistory(merged);
        }
        const localHistory=window.SessionManager.loadHistory();
        if(localHistory&&localHistory.length){await window.DBManager.migrateLocalData(user.id,localHistory,profile);}
        const localProfile=window.SessionManager.loadProfile();
        if(localProfile&&localProfile.season_id&&!(profile&&profile.current_color_type)){
          await window.DBManager.saveColorType(user.id,localProfile.season_id,'local_import');
          await window.DBManager.updateProfile(user.id,{current_color_type:localProfile.season_id});
          setSeason(localProfile.season_id);setScreen('home');
        }
      }catch(e){console.error('Profile load error:',e);}
      finally{setMigrating(false);}
    })();
  },[user,authReady]);

  const handleAuthSuccess=async(authUser,mode)=>{
    setAuthModal(null);
    window.ymGoal(mode==='register'?'register_success':'login_success');
  };

  const handleLogout=async()=>{
    try{
      await window.AuthManager.signOut();
      setSeason(null);setHistory([]);setResult(null);setDetection(null);
      window.SessionManager.clearLocalOnly();
      setScreen('welcome');
      window.ymGoal('logout_success');
    }catch(e){console.error('Logout error:',e);}
  };

  const handleDeleteProfile=()=>{
    setSeason(null);setHistory([]);setResult(null);setDetection(null);
    window.SessionManager.clearAll();
    setScreen('welcome');
  };

  const goHome=()=>setScreen(season?'home':'welcome');
  const go=sc=>()=>setScreen(sc);

  const analyze=async(imgObj,prev)=>{
    setPreview(prev);setErr(null);setScreen('analyzing');
    try{
      const r=await window.analyzeClothing(imgObj,season);
      setResult(r);
      const newItem={result:r,preview:prev,id:Date.now(),created_at:new Date().toISOString()};
      const nh=[newItem,...history];
      setHistory(nh);window.SessionManager.saveHistory(nh);
      if(user){window.DBManager.saveOutfitAnalysis(user.id,newItem).catch(e=>console.error('saveOutfitAnalysis:',e));}
      setScreen('result');
    }catch(e){setErr(t('analysisFailed'));setScreen('analyze');}
  };

  const confirmSeason=sc=>{
    setSeason(sc);window.SessionManager.saveProfile(sc);
    if(user){
      window.DBManager.saveColorType(user.id,sc,'manual').catch(e=>console.error('saveColorType:',e));
      window.DBManager.updateProfile(user.id,{current_color_type:sc}).catch(e=>console.error('updateProfile:',e));
    }
    setScreen('home');
  };

  const handleClearHistory=async()=>{
    setHistory([]);window.SessionManager.saveHistory([]);
  };

  const handleClearHistoryRemote=async()=>{
    setHistory([]);window.SessionManager.saveHistory([]);
    if(user){
      try{await window.DBManager.deleteAllOutfitHistory(user.id);}
      catch(e){console.error('deleteAllOutfitHistory error:',e);}
    }
    setScreen('home');
  };

  const handleClearAll=()=>{
    if(!user){setSeason(null);setHistory([]);setResult(null);setDetection(null);setScreen('welcome');}
  };

  if(!authReady){
    return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12}}>
      <Spin/><div style={{fontSize:13,color:'#888880'}}>Chromé</div>
    </div>;
  }

  return<>
    {updateReady&&<UpdateBanner t={t} onUpdate={applyUpdate}/>}
    {!isOnline&&<OfflineBadge t={t}/>}
    {showInstallBanner&&installable&&!installed&&<InstallBanner t={t} onInstall={async()=>{await promptInstall();setShowInstallBanner(false);}} onDismiss={()=>setShowInstallBanner(false)}/>}
    {migrating&&<div style={{background:'#f0f4fa',borderBottom:'1px solid #c8d8f0',padding:'8px 1.5rem',fontSize:13,color:'#7A96B8',display:'flex',alignItems:'center',gap:8}}><Spin/>{t('authMigrating')}</div>}

    {authModal&&<AuthModal initialMode={authModal} onClose={()=>setAuthModal(null)} onSuccess={handleAuthSuccess} t={t}/>}

    <Nav season={season} onLogoClick={goHome} onSeasonInfoClick={season?go('season-info'):undefined} onSettings={go('settings')} onAuthOpen={m=>setAuthModal(m)} user={user} t={t} s={s} isOnline={isOnline} installed={installed}/>

    {err&&<div style={{background:'#fce4ec',border:'1px solid #f48fb1',borderRadius:8,padding:'10px 16px',margin:'1rem 1.5rem',fontSize:13,color:'#b71c1c',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}><span style={{lineHeight:1.5}}>{err}</span><span style={{cursor:'pointer',flexShrink:0}} onClick={()=>setErr(null)}>×</span></div>}

    {screen==='welcome'&&<Welcome onStart={go('setup')} t={t}/>}
    {screen==='home'&&season&&<HomePage season={season} history={history} onAnalyze={go('analyze')} onHistory={go('history')} onChangeType={go('setup')} onSeasonInfo={go('season-info')} onAuthOpen={m=>setAuthModal(m)} user={user} t={t} s={s}/>}
    {screen==='season-info'&&season&&<SeasonInfo seasonId={season} onBack={goHome} t={t} s={s}/>}
    {screen==='setup'&&<Setup onManual={go('manual')} onPhoto={go('photo')} onBack={goHome} t={t}/>}
    {screen==='manual'&&<ManualSelect onSelect={confirmSeason} onBack={go('setup')} t={t} s={s}/>}
    {screen==='photo'&&<PhotoScreen onDetected={d=>{setDetection(d);setScreen('detected');}} onBack={go('setup')} setErr={setErr} t={t} lang={lang}/>}
    {screen==='detected'&&detection&&<Detected d={detection} onConfirm={confirmSeason} onOverride={go('manual')} onBack={go('setup')} t={t} s={s}/>}
    {screen==='analyze'&&season&&<AnalyzePage season={season} onAnalyze={analyze} onBack={goHome} t={t} s={s} lang={lang}/>}
    {screen==='analyzing'&&<Analyzing t={t}/>}
    {screen==='result'&&result&&<Result result={result} preview={preview} season={season} onBack={go('analyze')} t={t} s={s} lang={lang}/>}
    {screen==='history'&&<History history={history} onBack={goHome} onClear={()=>{handleClearHistory();setScreen('home');}} onClearRemote={handleClearHistoryRemote} user={user} t={t} s={s}/>}
    {screen==='settings'&&<Settings onBack={goHome} onClearAll={handleClearAll} onAuthOpen={m=>setAuthModal(m)} user={user} onLogout={handleLogout} onDeleteProfile={handleDeleteProfile} t={t} lang={lang}/>}
  </>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
