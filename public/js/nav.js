// ===== 导航栏链接生成 =====
// 适用于使用动态导航的页面（evolve.html 等）
// 导航交互（移动端菜单）由 common.js 的 initNavMore() 统一处理
document.addEventListener('DOMContentLoaded', function() {
  const navInner = document.getElementById('navLinks');
  if (!navInner) return;

  const pages = [
    { href: '/', text: '首页' },
    { href: '/mutualism.html', text: '互作类型' },
    { href: '/chemical.html', text: '化学通讯' },
    { href: '/evolve.html', text: '进化沙盒', active: true },
    { href: '/story.html', text: '微观战争' },
    { href: '/about.html', text: '关于' }
  ];

  const currentPath = location.pathname;
  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = p.href;
    a.className = 'nav-link';
    if (p.active || currentPath.endsWith(p.href) || (p.href === '/' && currentPath === '/')) {
      a.classList.add('active');
    }
    a.textContent = p.text;
    navInner.appendChild(a);
  });
});
