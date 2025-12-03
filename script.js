// Full frontend script - premium welcome with GSAP + tsParticles, signup/login/logout, admin modal, + UI niceties
document.addEventListener('DOMContentLoaded', function () {
  const ADMIN_PASS = 'I am beautiful@12344';
  const CONFIG = window.APP_CONFIG || { USE_SERVER: false, API_BASE: '' };
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // Elements
  const authOverlay = qs('#authOverlay');
  const loginInsta = qs('#loginInsta'), loginPass = qs('#loginPass'), loginBtn = qs('#loginBtn');
  const showSignup = qs('#showSignup'), showLogin = qs('#showLogin'), createBtn = qs('#createBtn');
  const nameInput = qs('#nameInput'), instaInput = qs('#instaInput'), newPass = qs('#newPass');
  const authMsg = qs('#authMsg'), signupMsg = qs('#signupMsg');
  const forgotLink = qs('#forgotLink'), forgotForm = qs('#forgotForm'), forgotInsta = qs('#forgotInsta'), sendReset = qs('#sendReset'), forgotMsg = qs('#forgotMsg');
  const closeAuth = qs('#closeAuth'), websiteContent = qs('#websiteContent');
  const premiumWelcome = qs('#premiumWelcome'), skipWelcome = qs('#skipWelcome');
  const welcomeNeon = qs('#welcomeNeon'), welcomeCinematic = qs('#welcomeCinematic');
  const greeting = qs('#greeting'), logoutBtn = qs('#logoutBtn');
  const adminBtn = qs('#adminBtn'), adminModal = qs('#adminModal');

  // Local storage helpers
  const STORAGE_KEY = 'pp_users_final_v1';
  function localGetUsers(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
  function localSaveUsers(users){ localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
  function localFindUser(insta){ return localGetUsers().find(u=>u.insta.toLowerCase()===insta.toLowerCase()); }

  // Show/hide auth sections
  function showSection(id){
    qs('#loginForm').style.display = id==='login' ? 'block' : 'none';
    qs('#signupForm').style.display = id==='signup' ? 'block' : 'none';
    qs('#forgotForm').style.display = id==='forgot' ? 'block' : 'none';
    authMsg.textContent = signupMsg.textContent = forgotMsg.textContent = '';
  }
  showSignup && showSignup.addEventListener('click', ()=> showSection('signup'));
  showLogin && showLogin.addEventListener('click', ()=> showSection('login'));
  forgotLink && forgotLink.addEventListener('click', (e)=>{ e.preventDefault(); showSection('forgot'); });
  qs('#backLogin') && qs('#backLogin').addEventListener('click', ()=> showSection('login'));
  closeAuth && closeAuth.addEventListener('click', ()=> { authOverlay.style.display='none'; });

  // Signup (local fallback)
  createBtn && createBtn.addEventListener('click', ()=>{
    const name = nameInput.value.trim(), insta = instaInput.value.trim(), pass = newPass.value;
    if(!name||!insta||!pass){ signupMsg.textContent='Fill all fields'; return; }
    const users = localGetUsers();
    if(users.find(u=>u.insta.toLowerCase()===insta.toLowerCase())){ signupMsg.textContent='Instagram ID exists'; return; }
    users.push({ id: Date.now(), name, insta, passHash: btoa(pass), created: new Date().toISOString() });
    localSaveUsers(users);
    signupMsg.textContent='Account created locally. Please login.';
    setTimeout(()=> showSection('login'), 900);
  });

  // Login
  loginBtn && loginBtn.addEventListener('click', ()=>{
    const insta = loginInsta.value.trim(), pass = loginPass.value;
    if(!insta||!pass){ authMsg.textContent='Fill both fields'; return; }
    // try server if enabled (not implemented server-side here) -> fallback local
    const u = localFindUser(insta);
    if(!u){ authMsg.textContent='Account not found'; return; }
    if(u.passHash !== btoa(pass)){ authMsg.textContent='Wrong password'; return; }
    // success
    localStorage.setItem('pp_session', JSON.stringify({ insta: u.insta, name: u.name }));
    authOverlay.style.display='none';
    playWelcome(u.name);
  });

  // Logout
  logoutBtn && logoutBtn.addEventListener('click', ()=> {
    if(confirm('Logout?')){ localStorage.removeItem('pp_session'); websiteContent.style.display='none'; authOverlay.style.display='flex'; }
  });

  // check session
  (function checkSession(){ try{ const s = JSON.parse(localStorage.getItem('pp_session')||'null'); if(s && s.name){ authOverlay.style.display='none'; playWelcome(s.name); } }catch(e){} })();

  // Welcome sequence using GSAP + tsParticles
  function playWelcome(name){
    websiteContent.style.display='block';
    greeting.textContent = name ? 'Hi, ' + name : '';
    premiumWelcome.classList.add('show');

    // neon text animation
    welcomeNeon.textContent = 'Welcome, ' + name + ' ✨';
    welcomeCinematic.textContent = 'We make magic.';

    const tl = gsap.timeline();
    tl.to(welcomeNeon, {duration:0.9, y:0, opacity:1, ease:'power3.out', textShadow:'0 0 40px #ff66cc'});
    tl.call(()=> launchParticles(), [], null, '+=0.05');
    tl.to(welcomeCinematic, {duration:0.8, y:0, opacity:1, ease:'power2.out'}, '+=0.2');
    tl.to(premiumWelcome, {duration:0.9, opacity:0, pointerEvents:'none', onComplete:()=> { premiumWelcome.classList.remove('show'); }}, '+=1.1');

    skipWelcome.onclick = ()=> { tl.kill(); premiumWelcome.classList.remove('show'); websiteContent.style.display='block'; };
  }

  // tsParticles burst
  function launchParticles(){
    if(!window.tsParticles) return;
    tsParticles.load('tsparticles', {
      particles: { number:{value:0}, color:{value:['#ff66cc','#ffd5e6','#ffffff']}, shape:{type:'circle'}, size:{value:{min:3,max:7}},
      move:{enable:true,speed:8,outModes:{default:'destroy'}}, life:{duration:{value:0.9,count:1}}},
      emitters: [{position:{x:50,y:40}, rate:{quantity:0,delay:0}}],
    }).then(container=>{
      container.particles.addEmitter({
        position:{x:50,y:40},
        rate:{quantity:160,delay:0},
        life:{duration:0.6,count:1}
      });
      setTimeout(()=>{ try{ container.destroy(); }catch(e){} },1600);
    }).catch(()=>{});
  }

  // Admin button
  adminBtn.addEventListener('click', ()=>{
    const p = prompt('Enter admin password:');
    if(p === ADMIN_PASS) openAdminModal();
    else if(p!==null) alert('Wrong admin password');
  });

  function openAdminModal(){
    const users = localGetUsers();
    adminModal.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className='modalWrap';
    const card = document.createElement('div'); card.className='modalCard';
    const title = document.createElement('h3'); title.textContent = 'Local Users';
    card.appendChild(title);
    if(users.length===0){ const p = document.createElement('p'); p.textContent='No users saved locally.'; card.appendChild(p); }
    users.slice().reverse().forEach(u=>{
      const row = document.createElement('div'); row.className='userRow';
      row.innerHTML = `<div>${u.name} — @${u.insta}</div><div><button class="btn small">Delete</button></div>`;
      row.querySelector('button').addEventListener('click', ()=>{ if(confirm('Delete user?')){ const list=localGetUsers().filter(x=>x.id!==u.id); localSaveUsers(list); openAdminModal(); } });
      card.appendChild(row);
    });
    const close = document.createElement('button'); close.textContent='Close'; close.className='btn small'; close.addEventListener('click', ()=> adminModal.innerHTML='');
    card.appendChild(close); wrap.appendChild(card); adminModal.appendChild(wrap);
  }

  // UI niceties: ripple
  qsa('.btn').forEach(btn=> btn.addEventListener('click', function(e){ const rect=this.getBoundingClientRect(); const span=document.createElement('span'); span.className='ripple'; const size=Math.max(rect.width,rect.height)*1.2; span.style.width=span.style.height=size+'px'; span.style.left=(e.clientX-rect.left-size/2)+'px'; span.style.top=(e.clientY-rect.top-size/2)+'px'; this.appendChild(span); setTimeout(()=>span.remove(),700); }));

  // flip cards, videos intersection
  qsa('.card').forEach(card=>{ card.addEventListener('click', function(){ if(window.innerWidth<=900) this.classList.toggle('flip'); }); const inner = card.querySelector('.inner'); if(inner){ inner.setAttribute('tabindex',0); inner.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.classList.toggle('flip'); } }); } });
  const videos = qsa('video.videoBox');
  if(videos.length && 'IntersectionObserver' in window){ const obs=new IntersectionObserver(entries=>{ entries.forEach(ent=>{ const v=ent.target; if(ent.isIntersecting) v.play().catch(()=>{}); else { try{ v.pause(); v.currentTime=0;}catch(e){} } }); }, {threshold:0.45}); videos.forEach(v=> obs.observe(v)); } else videos.forEach(v=> v.play().catch(()=>{}));

  // music controls
  const bg = qs('#bgMusic'), playBtn = qs('#playBtn'), pauseBtn = qs('#pauseBtn'), musicTime = qs('#musicTime');
  function formatTime(s){ if(!isFinite(s)) return '00:00'; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
  if(playBtn) playBtn.addEventListener('click', ()=> bg && bg.play().catch(()=>{}));
  if(pauseBtn) pauseBtn.addEventListener('click', ()=> bg && bg.pause());
  if(bg) bg.addEventListener('timeupdate', ()=> { musicTime.textContent = formatTime(bg.currentTime); });

});
