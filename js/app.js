/* ── NAV — упрощённый ── */
function Nav({season,onLogoClick,onSeasonInfoClick,onSettings,onAuthOpen,user,t,s,isOnline,installed}){
  return(
    <nav style={{
      borderBottom:'1px solid #e8e4dc',
      padding:'0.75rem 1rem',
      display:'flex',
      alignItems:'center',
      gap:8,
      background:'#fff',
      position:'sticky',
      top:0,
      zIndex:10,
      width:'100%',
      boxSizing:'border-box',
      overflow:'hidden'
    }}>

      {/* Логотип */}
      <div
        onClick={()=>{window.ymGoal('header_logo_click');onLogoClick();}}
        style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flexShrink:0}}
      >
        <div style={{width:28,height:28,borderRadius:'8px',background:'#1a1a18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🎨</div>
        <span style={{fontSize:17,fontWeight:400,letterSpacing:'-0.01em',whiteSpace:'nowrap'}}>Chromé</span>
      </div>

      {/* offline */}
      {!isOnline&&(
        <span style={{fontSize:11,color:'#b71c1c',background:'#fce4ec',borderRadius:4,padding:'2px 7px',whiteSpace:'nowrap',flexShrink:0}}>offline</span>
      )}

      {/* Цветотип — только если выбран */}
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

      {/* Правая часть */}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>

        {/*
          Кнопка "Войти" — только если:
          - пользователь НЕ авторизован
          - И цветотип ещё НЕ выбран
          Если цветотип выбран — баннер внизу HomePage делает эту работу
        */}
        {!user&&!season&&(
          <button
            onClick={()=>{window.ymGoal('header_login_click');onAuthOpen('login');}}
            style={{
              background:'#1a1a18',
              border:'none',
              color:'#fafaf8',
              fontSize:13,
              cursor:'pointer',
              fontFamily:'Georgia,serif',
              padding:'6px 14px',
              borderRadius:6,
              transition:'opacity 0.15s',
              whiteSpace:'nowrap',
              flexShrink:0
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.8'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            {t('authLogin')}
          </button>
        )}

        {/* Шестерёнка — всегда */}
        <button
          onClick={onSettings}
          style={{
            cursor:'pointer',
            fontSize:18,
            padding:'4px 6px',
            borderRadius:6,
            transition:'background 0.15s',
            color:'#888880',
            background:'none',
            border:'none',
            flexShrink:0,
            lineHeight:1
          }}
          onMouseEnter={e=>e.currentTarget.style.background='#f5f2eb'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          aria-label="Settings"
        >
          ⚙️
        </button>

      </div>
    </nav>
  );
}
