/* ── NAV — адаптивный ── */
function Nav({season,onLogoClick,onSeasonInfoClick,onSettings,onAuthOpen,user,t,s,isOnline,installed}){
  return(
    <nav className="nav-root">
      {/* Логотип */}
      <div
        onClick={()=>{window.ymGoal('header_logo_click');onLogoClick();}}
        style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0,minWidth:0}}
      >
        <div style={{width:28,height:28,borderRadius:'8px',background:'#1a1a18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🎨</div>
        <span className="nav-brand-name" style={{fontSize:17,fontWeight:400,letterSpacing:'-0.01em',whiteSpace:'nowrap'}}>Chromé</span>
      </div>

      {/* Бейдж web/app — скрывается на узких */}
      <span className="nav-badge">{installed?t('standaloneMode'):t('offline')}</span>

      {/* offline-индикатор */}
      {!isOnline&&(
        <span style={{fontSize:11,color:'#b71c1c',background:'#fce4ec',borderRadius:4,padding:'2px 7px',whiteSpace:'nowrap',flexShrink:0}}>offline</span>
      )}

      {/* Цветотип в шапке */}
      {season&&(
        <span
          onClick={()=>{window.ymGoal('header_color_type_click');onSeasonInfoClick&&onSeasonInfoClick();}}
          style={{fontSize:12,color:'#888880',fontStyle:'italic',display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'4px 6px',borderRadius:6,transition:'background 0.15s',whiteSpace:'nowrap',flexShrink:1,minWidth:0,overflow:'hidden'}}
          onMouseEnter={e=>e.currentTarget.style.background='#f5f2eb'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <span style={{width:8,height:8,borderRadius:'50%',background:window.SEASONS[season].accent,display:'inline-block',flexShrink:0}}/>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s(window.SEASONS[season].name)}</span>
        </span>
      )}

      {/* Правая часть — auth кнопки + шестерёнка */}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
        {!user&&(
          <>
            {/* "Войти" скрывается через CSS на узких экранах */}
            <button
              className="nav-btn-login"
              onClick={()=>{window.ymGoal('header_login_click');onAuthOpen('login');}}
            >
              {t('authLogin')}
            </button>
            <button
              className="nav-btn-register"
              onClick={()=>{window.ymGoal('header_register_click');onAuthOpen('register');}}
            >
              {t('authRegister')}
            </button>
          </>
        )}
        <button
          className="nav-btn-settings"
          onClick={onSettings}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>
    </nav>
  );
}

/* ── PWA INSTALL BANNER — фикс ширины ── */
function InstallBanner({t,onInstall,onDismiss}){
  return(
    <div className="pwa-install-banner">
      <span style={{fontSize:18,flexShrink:0}}>📲</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:400}}>{t('installApp')}</div>
        <div style={{fontSize:11,opacity:0.7}}>{t('installDesc')}</div>
      </div>
      <div style={{display:'flex',gap:8,flexShrink:0}}>
        <Btn
          onClick={()=>{window.ymGoal('install_app_click');onInstall();}}
          variant="success"
          small
        >
          {t('installBtn')}
        </Btn>
        <Btn
          onClick={onDismiss}
          variant="ghost"
          small
          style={{color:'#aaa'}}
        >
          {t('installDismiss')}
        </Btn>
      </div>
    </div>
  );
}
