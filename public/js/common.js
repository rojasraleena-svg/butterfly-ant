// ===== 共享JS v4 — STOD级动效系统 =====

const IMG_BASE = '/img';
const IMG = {
  hero: `${IMG_BASE}/hero.jpg`,
  egg: `${IMG_BASE}/egg.jpg`,
  larva: `${IMG_BASE}/larva.jpg`,
  carry: `${IMG_BASE}/carry.jpg`,
  nest: `${IMG_BASE}/nest.jpg`,
  emerge: `${IMG_BASE}/emerge.jpg`,
  chemical: `${IMG_BASE}/chemical.jpg`,
  meadow: `${IMG_BASE}/meadow.jpg`,
  species: `${IMG_BASE}/species.jpg`,
  meeting: `${IMG_BASE}/meeting.jpg`
};

function loadHeroImg() { const el = document.getElementById('heroImg'); if(el) el.style.backgroundImage = `url(${IMG.hero})`; }
function loadDataImages() { document.querySelectorAll('[data-img]').forEach(el => { el.src = IMG[el.dataset.img]; }); }

// ===== Lightbox (enhanced) =====
function openLB(src, caption) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lbImg').src = src;
  document.getElementById('lbCaption').innerHTML = caption;
  lb.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeLB() {
  document.getElementById('lightbox').classList.remove('show');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLB(); });

// ===== Hero particles (enhanced — varied shapes & glow) =====
function createParticles() {
  const hero = document.getElementById('hero');
  if(!hero) return;
  for(let i = 0; i < 22; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    const size = Math.random()*3+1.5;
    const hue = 200 + Math.random()*60; // blue-cyan range
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;` +
      `background:hsla(${hue},80%,70%,${0.2+Math.random()*0.3});` +
      `box-shadow:0 0 ${size*2}px hsla(${hue},80%,70%,0.3);` +
      `animation-duration:${Math.random()*12+10}s;animation-delay:${Math.random()*12}s;` +
      `border-radius:${Math.random()>0.5?'50%':'2px'};`;
    hero.appendChild(p);
  }
}

// ===== Stats counter (singleton guard) =====
let _countersAnimated = false;
function animateCounters() {
  if(_countersAnimated) return;
  _countersAnimated = true;
  document.querySelectorAll('.stat-num').forEach(el => {
    const t = parseInt(el.dataset.target);
    let current = 0;
    const duration = 1400, startTime = performance.now();
    function tick(now) {
      const p = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - p, 3);
      current = Math.round(ease * t);
      el.textContent = current + (t >= 100 ? '+' : '%');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(() => setTimeout(() => requestAnimationFrame(tick), 400));
  });
}

// ===== Scroll reveal (re-trigger on re-entry) =====
function initReveal() {
  const REVEAL_SELECTOR = '.type-card,.stat-box,.chem-card,.g-item,.mod-card,.example-card,.spectrum-section,.quiz-card';
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('fade-in');
        // Trigger counters when stats row enters view
        if(e.target.classList.contains('stat-row') || e.target.closest('.stats-row')) {
          animateCounters();
        }
      } else {
        // Re-trigger when leaving viewport (allows re-animation on scroll back)
        // Only remove if element is significantly above/below viewport
        const rect = e.boundingClientRect;
        if(rect.bottom < 0 || rect.top > window.innerHeight) {
          // Keep fade-in class for elements that should stay visible after first reveal
          // For cards, we keep them visible
        }
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => obs.observe(el));

  // Also observe stats-row for counter trigger
  document.querySelectorAll('.stats-row').forEach(el => obs.observe(el));
}

// ===== Gallery builder (with staggered entrance) =====
function buildGallery(gridId) {
  const data = [
    { img:IMG.meeting, title:'🦋 初遇', desc:'大蓝蝶与红蚁的第一次接触' },
    { img:IMG.egg, title:'🥚 新生', desc:'产在百里香叶面上的微小卵粒' },
    { img:IMG.larva, title:'🐛 守护', desc:'蚂蚁军团保护取食中的幼虫' },
    { img:IMG.carry, title:'🐜 归巢', desc:'蚂蚁队列搬运毛毛虫回巢' },
    { img:IMG.nest, title:'🏠 潜伏', desc:'蚁巢深处的特洛伊木马' },
    { img:IMG.emerge, title:'✨ 重生', desc:'穿越黑暗后的羽化时刻' },
    { img:IMG.chemical, title:'🧪 信号', desc:'跨越物种边界的化学对话' },
    { img:IMG.meadow, title:'🌿 栖息地', desc:'高山草甸——共生的舞台' },
    { img:IMG.species, title:'🎨 多样性', desc:'灰蝶科的喜蚁性物种集合' },
  ];
  const grid = document.getElementById(gridId); if(!grid) return;
  data.forEach((g, i) => {
    const item = document.createElement('div');
    item.className='g-item fade-in';
    item.style.animationDelay = `${i * 0.06}s`;
    item.innerHTML=`<img src="${g.img}" alt="${g.title}" loading="lazy"><div class="g-info"><h4>${g.title}</h4><p>${g.desc}</p></div>`;
    item.onclick=()=>openLB(g.img,`${g.title} — ${g.desc}`);
    grid.appendChild(item);
  });
}

// ===== Nav active state auto-detection =====
function initNavActive() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if(href && (path.endsWith(href) || (path === '/' && href === '/'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ===== Smooth page transition for internal links =====
function initPageTransitions() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if(!a) return;
    const href = a.getAttribute('href');
    // Only intercept same-origin internal links (not external, not anchors)
    if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;

    e.preventDefault();
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.25s ease';

    setTimeout(() => {
      window.location.href = href;
    }, 250);
  });

  // Fade in on page load
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.transition = 'opacity 0.35s var(--ease-out, cubic-bezier(0.16,1,0.3,1))';
      document.body.style.opacity = '1';
    });
  });
}

// ===== Footer year injection =====
function initFooterYear() {
  const el = document.getElementById('year');
  if(el) el.textContent = new Date().getFullYear();
}

// ===== Lifecycle timeline parallax enhancement =====
function initLifecycleParallax() {
  const images = document.querySelectorAll('.lc-img-wrap img');
  if(!images.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.style.transform = 'scale(1)';
      }
    });
  }, { threshold: 0.3 });

  images.forEach(img => observer.observe(img));

  // Subtle parallax on scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(!ticking) {
      requestAnimationFrame(() => {
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          const center = rect.top + rect.height/2;
          const viewportCenter = window.innerHeight / 2;
          const offset = (center - viewportCenter) / window.innerHeight;
          img.style.transform = `scale(1) translateY(${offset * -8}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ===== Shared init =====
function sharedInit(){
  initPageTransitions();
  loadHeroImg(); loadDataImages(); createParticles();
  initReveal(); initNavActive(); initFooterYear();
  initLifecycleParallax();
  initNavMore();
}

// ===== Nav More Dropdown =====
function initNavMore() {
  const more = document.querySelector('.nav-more');
  if(!more) return;
  const btn = more.querySelector('.nav-more-btn');
  btn.addEventListener('click', e => { e.stopPropagation(); more.classList.toggle('open'); });
  document.addEventListener('click', e => { if(!more.contains(e.target)) more.classList.remove('open'); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') more.classList.remove('open'); });
}
