// ===== 共享JS：图片URL、Lightbox、粒子效果、导航高亮 =====

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

// Lightbox
function openLB(src, caption) { document.getElementById('lbImg').src = src; document.getElementById('lbCaption').innerHTML = caption; document.getElementById('lightbox').classList.add('show'); }
function closeLB() { document.getElementById('lightbox').classList.remove('show'); }
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLB(); });

// Hero particles
function createParticles() {
  const hero = document.getElementById('hero');
  if(!hero) return;
  for(let i = 0; i < 18; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    const size = Math.random()*3+1.5;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:rgba(${100+Math.random()*155},${180+Math.random()*75},255,${0.25+Math.random()*0.35});animation-duration:${Math.random()*12+10}s;animation-delay:${Math.random()*12}s`;
    hero.appendChild(p);
  }
}

// Stats counter
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const t = parseInt(el.dataset.target);
    let current = 0;
    const duration = 1200, startTime = performance.now();
    function tick(now) {
      const p = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - p, 3);
      current = Math.round(ease * t);
      el.textContent = current + (t >= 100 ? '+' : '%');
      if (p < 1) requestAnimationFrame(tick);
    }
    // Use rAF to ensure DOM is ready, with slight delay for fade-in animation
    requestAnimationFrame(() => setTimeout(() => requestAnimationFrame(tick), 300));
  });
}

// Scroll reveal
function initReveal() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('fade-in'); }),{threshold:0.08});
  document.querySelectorAll('.type-card,.stat-box,.chem-card,.g-item,.mod-card,.example-card').forEach(el => obs.observe(el));
}

// Gallery builder
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
  data.forEach(g => {
    const item = document.createElement('div'); item.className='g-item';
    item.innerHTML=`<img src="${g.img}" alt="${g.title}" loading="lazy"><div class="g-info"><h4>${g.title}</h4><p>${g.desc}</p></div>`;
    item.onclick=()=>openLB(g.img,`${g.title} — ${g.desc}`);
    grid.appendChild(item);
  });
}

// Shared init
function sharedInit(){ loadHeroImg(); loadDataImages(); createParticles(); animateCounters(); initReveal(); }
