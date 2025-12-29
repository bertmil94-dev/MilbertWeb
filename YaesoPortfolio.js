(function(){
  // Theme toggle
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(t){
    if(t === 'dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    if(toggle){ const isDark = t === 'dark'; toggle.setAttribute('aria-pressed', String(isDark)); toggle.textContent = isDark ? '☀️' : '🌙'; }
  }
  // force dark theme to use a darker palette by default per user request
  applyTheme('dark');
  try{ localStorage.setItem('theme','dark'); }catch(e){}
  if(toggle){ toggle.addEventListener('click', ()=>{
    const isDark = root.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next); localStorage.setItem('theme', next);
  }); }

  // Palette preview picker: apply a site-wide audit class to body and persist selection
  const palettePicker = document.getElementById('palettePicker');
  const paletteKey = 'previewPalette';
  const applyPalette = (p)=>{
    document.body.classList.remove('theme-audit-warm','theme-audit-moody','theme-audit-film');
    if(p && p !== 'default') document.body.classList.add('theme-audit-' + p);
    if(palettePicker) palettePicker.value = p || 'default';
  };
  // initialize palette preview; default to 'moody' (darker) per user request
  try{ const storedP = localStorage.getItem(paletteKey); const startP = storedP || 'moody'; localStorage.setItem(paletteKey, startP); applyPalette(startP); }catch(e){ applyPalette('moody'); }
  if(palettePicker){ palettePicker.addEventListener('change', function(){ const v = this.value; try{ localStorage.setItem(paletteKey, v); }catch(e){} applyPalette(v); }); }

  // Mobile menu
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if(mobileMenu) mobileMenu.hidden = true; // keep it hidden by default
  if(burger){ burger.addEventListener('click', ()=>{
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', (!expanded).toString());
    if(!expanded){ mobileMenu.classList.add('show'); mobileMenu.hidden = false; } else { mobileMenu.classList.remove('show'); mobileMenu.hidden = true; }
  }); }

  // Helper to read header height from CSS var (fallbacks to header element height)
  function getHeaderHeight(){
    const v = getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '';
    const px = parseInt(v.trim(), 10);
    if(!isNaN(px)) return px;
    const he = document.querySelector('.site-header');
    return he ? he.offsetHeight : 72;
  }

  // Smooth scroll
  document.querySelectorAll('a[data-link]').forEach(a=> a.addEventListener('click', function(e){
    e.preventDefault();
    const id = this.getAttribute('href').slice(1);
    const el = document.getElementById(id); if(!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getHeaderHeight(); window.scrollTo({top,behavior:'smooth'});
    if(mobileMenu && mobileMenu.classList.contains('show')){ mobileMenu.classList.remove('show'); mobileMenu.hidden = true; if(burger) burger.setAttribute('aria-expanded','false'); }
  }));

  // Ensure mobile menu closes when resizing and keep nav/burger visible appropriately
  const navList = document.querySelector('.nav-list');
  function onResize(){
    if(window.innerWidth > 768){
      // Wide: close mobile menu and show full nav
      if(mobileMenu && (mobileMenu.classList.contains('show') || !mobileMenu.hidden)){
        mobileMenu.classList.remove('show');
        mobileMenu.hidden = true;
        if(burger) burger.setAttribute('aria-expanded','false');
      }
      if(navList) navList.style.display = '';
      if(burger) burger.style.display = '';
    } else {
      // Small: ensure nav is hidden and burger is visible (defensive for odd edge cases)
      if(navList) navList.style.display = 'none';
      if(burger) burger.style.display = 'inline-flex';
    }
  }
  window.addEventListener('resize', onResize);
  onResize();

  // Highlight active nav item based on scroll
  const sections = document.querySelectorAll('main section[id]');
  const navMap = Array.from(document.querySelectorAll('.nav-list a')).reduce((m,a)=>{m[a.getAttribute('href').slice(1)]=a;return m},{})
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        const id = ent.target.getAttribute('id');
        Object.values(navMap).forEach(a=>a.classList.remove('active'));
        if(navMap[id]) navMap[id].classList.add('active');
      }
    })
  },{threshold:0.6});
  sections.forEach(s=>obs.observe(s));

  // Lightbox with navigation
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('.lb-img');
  const lbCaption = lightbox.querySelector('.lb-caption');
  const lbClose = lightbox.querySelector('.lb-close');
  const lbPrev = lightbox.querySelector('.lb-prev');
  const lbNext = lightbox.querySelector('.lb-next');
  const thumbs = Array.from(document.querySelectorAll('#projects .proj-thumb'));
  let currentIndex = 0;
  function openAt(idx){
    const img = thumbs[idx];
    if(!img) return;
    currentIndex = idx;
    lbImg.src = img.getAttribute('src');
    lbCaption.textContent = img.alt || '';
    lightbox.removeAttribute('hidden');
    lightbox.classList.add('open');
    // move focus to next for keyboard users
    if(lbNext) lbNext.focus();
  }
  function closeLB(){ lightbox.classList.remove('open'); lightbox.setAttribute('hidden',''); lbImg.src=''; lbCaption.textContent=''; }
  function prev(){ if(thumbs.length===0) return; openAt((currentIndex - 1 + thumbs.length) % thumbs.length); }
  function next(){ if(thumbs.length===0) return; openAt((currentIndex + 1) % thumbs.length); }
  lbClose.addEventListener('click', closeLB);
  if(lbPrev) lbPrev.addEventListener('click', prev);
  if(lbNext) lbNext.addEventListener('click', next);
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLB(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLB(); if(lightbox.classList.contains('open')){ if(e.key==='ArrowLeft') prev(); if(e.key==='ArrowRight') next(); } });
  thumbs.forEach((img, idx)=>{
    img.style.cursor='zoom-in';
    img.setAttribute('tabindex','0');
    img.addEventListener('click', ()=>{ openAt(idx); });
    img.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openAt(idx); } });
  });

  // touch swipe support for lightbox (basic)
  const lbInner = lightbox.querySelector('.lb-inner');
  let _touchStartX = 0, _touchStartY = 0, _touchStartTime = 0;
  function onTouchStart(e){ if(!lightbox.classList.contains('open')) return; const t = e.touches[0]; _touchStartX = t.clientX; _touchStartY = t.clientY; _touchStartTime = Date.now(); }
  function onTouchMove(e){ if(!_touchStartTime || e.touches.length > 1) return; const t = e.touches[0]; const dx = t.clientX - _touchStartX; const dy = t.clientY - _touchStartY; if(Math.abs(dx) > Math.abs(dy)) e.preventDefault(); }
  function onTouchEnd(e){ if(!_touchStartTime) return; const t = e.changedTouches[0]; const dx = t.clientX - _touchStartX; const dy = t.clientY - _touchStartY; _touchStartTime = 0; if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){ if(dx > 0) prev(); else next(); } }
  if(lbInner){ lbInner.addEventListener('touchstart', onTouchStart, {passive:true}); lbInner.addEventListener('touchmove', onTouchMove, {passive:false}); lbInner.addEventListener('touchend', onTouchEnd, {passive:true}); }

  // Header: add scrolled class to add subtle shadow when scrolled
  const headerEl = document.querySelector('.site-header');
  function checkScroll(){ if(window.scrollY > 8) headerEl && headerEl.classList.add('scrolled'); else headerEl && headerEl.classList.remove('scrolled'); }
  window.addEventListener('scroll', checkScroll); checkScroll();
  // Contact form (demo)
  const form = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  if(form){ form.addEventListener('submit', function(e){ e.preventDefault(); const name = document.getElementById('name').value.trim(); const email = document.getElementById('email').value.trim(); const message = document.getElementById('message').value.trim(); if(!name || !email || !message){ formMsg.textContent = 'Please fill in all fields.'; return; } formMsg.textContent = 'Thanks — message captured (demo).'; form.reset(); }); }
})();