// ===== 共享JS：图片URL、Lightbox、粒子效果、导航高亮 =====

const IMG = {
  hero: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_18bc71a6-e8cd-4b06-89a4-f7872d12a9ac.jpeg?sign=1806842292-3ee9514e7b-0-6df81f193a5d2bf431a568b0d60a648761d8fed8d7ff4157231c77d292166476',
  egg: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_dc864a7a-f1a0-43fd-b74f-5bd26137bdb8.jpeg?sign=1806836687-6cfd3d2d4c-0-7cdc8956ff8814a35966702f505b44b7699cd9509d61ecfc0e1f5acd4de9d6c7',
  larva: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_b97ebe12-1f0a-46fa-956b-9f392eb23408.jpeg?sign=1806836701-bc7bcb10f3-0-6323e01c3a2a99b5931df19d903f50a978a96853597d1f34fa32201af80fb2bc',
  carry: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_32122718-78bd-4a77-986b-8914cc502575.jpeg?sign=1806836721-e2898de459-0-bcb916da2100ba650309225ec6d40c153d657b92b6462ca73b8ba2f525078138',
  nest: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_ef93a733-4328-49fb-a173-7feb8d2304c8.jpeg?sign=1806836734-3adde39061-0-8d33f181c0137d903bc1ad027fbec28541fabd91fe7a77ec2e6cf53d922c5ecd',
  emerge: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_89cffc06-88ee-4cb5-81ea-315f68fc610a.jpeg?sign=1806842303-b2ac7d135f-0-d2c409630b2b082e385888f5b691c9f54cbcc98105bbf100ffe7b134bc5bd4a4',
  chemical: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_62ae5a05-c1c2-4c20-b6ce-bf331860f341.jpeg?sign=1806842317-8c72407c95-0-738777792ba8057992f5209bd7ea901d1f04eeabd525db6f7a4e421c5f16a4df',
  meadow: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_737b26fa-d314-458e-b75b-b36025739e6b.jpeg?sign=1806842328-d4afed24a3-0-e8231b91dba09a4d63ca595cf3f9df5e18cd39c7b506cc308b0017193aa89a07',
  species: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_1fe3c49a-5bfb-4bba-a709-34465113b649.jpeg?sign=1806836799-244f512879-0-7bcfe5cc382ef3c49274a67a016c0842685c67c3d15b342ac794701b28c29442',
  meeting: 'https://coze-coding-project.tos.coze.site/coze_storage_7620830704527704114/image/generate_image_bbaebf69-352e-4134-ac81-935894cf1431.jpeg?sign=1806836666-f408d5498d-0-29d69d04adfacdd9892614f38fe079523eb78985072affe18da61a2883ab26ec'
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
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-num').forEach(el => {
          const t = parseInt(el.dataset.target), step = t/40, timer = setInterval(() => {
            let c = parseFloat(el.dataset.current||'0')+step;
            if(c >= t){ c=t; clearInterval(timer); }
            el.dataset.current = c;
            el.textContent = Math.round(c)+(t>=100?'+':'%');
          }, 28);
        });
        obs.unobserve(entry.target);
      }
    });
  },{threshold:0.25});
  document.querySelectorAll('.stats-row').forEach(el => obs.observe(el));
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
