/**
 * 导航组件模块
 * 生成统一的导航 HTML，管理 active 状态
 */

const NAV_ITEMS = [
  { href: '/', label: '首页', slug: 'index' },
  { href: 'mutualism.html', label: '互作类型', slug: 'mutualism' },
  { href: 'lab.html', label: '虫痕鉴定', slug: 'lab' },
  { href: 'lifecycle.html', label: '生命循环', slug: 'lifecycle' },
  { href: 'chemical.html', label: '化学通讯', slug: 'chemical' },
  { href: 'gallery.html', label: '图鉴', slug: 'gallery' },
  { href: 'quiz.html', label: '测验', slug: 'quiz' },
  { href: 'about.html', label: '关于', slug: 'about' },
];

/**
 * 生成导航栏 HTML
 * @param {string} activeSlug - 当前激活页面的 slug
 * @returns {string} 导航 HTML 字符串
 */
function generateNavHTML(activeSlug) {
  const links = NAV_ITEMS.map(item => {
    const isActive = item.slug === activeSlug ? ' active' : '';
    return `    <a href="${item.href}" class="nav-link${isActive}">${item.label}</a>`;
  }).join('\n');

  return `<nav class="nav" aria-label="主导航">
  <div class="nav-inner">
    <a href="/" class="nav-logo"><img src="/img/logo.svg" alt="蝴蝶与蚂蚁"></a>
${links}
  </div>
</nav>`;
}

module.exports = { NAV_ITEMS, generateNavHTML };
