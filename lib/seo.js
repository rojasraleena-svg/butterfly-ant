/**
 * SEO 元数据模块
 * 为所有页面生成 meta 标签、Open Graph、Twitter Card 和 JSON-LD 结构化数据
 */

const SITE_NAME = '蝴蝶与蚂蚁 · 共生的艺术';
const SITE_URL = process.env.SITE_BASE_URL || 'https://butterfly.gqy25.top';
const DEFAULT_OG_IMAGE = '/img/hero.jpg';

const PAGE_META = {
  index: {
    title: '🦋 蝴蝶与蚂蚁 · 共生的艺术',
    description: '探索灰蝶科蝴蝶与蚂蚁之间最精妙的跨物种合作——从互利共生到社会性寄生，从化学通讯到基因协同进化的进化之舞。',
    ogImage: '/img/hero.jpg'
  },
  about: {
    title: '📖 关于 | 🦋 蝴蝶与蚂蚁',
    description: '深入了解蝴蝶与蚂蚁共生科普项目的初衷、参考文献、技术架构和科学背景。基于真实科学研究的互动式科普教育网站。',
    ogImage: '/img/meeting.jpg'
  },
  chemical: {
    title: '🧪 化学通讯 | 🦋 蝴蝶与蚂蚁',
    description: '深入了解DNO蜜腺、CHC化学拟态和振动信号——分子层面上的跨物种对话机制。包含互动CHC配对小游戏。',
    ogImage: '/img/chemical.jpg'
  },
  gallery: {
    title: '🖼️ 生态图鉴 | 🦋 蝴蝶与蚂蚁',
    description: 'AI生成的视觉日记，完整记录蝴蝶与蚂蚁互作的9个关键生态场景：初遇、新生、守护、归巢、潜伏、羽化等精彩瞬间。',
    ogImage: '/img/meeting.jpg'
  },
  lab: {
    title: '🔬 虫痕鉴定实验室 | 🦋 蝴蝶与蚂蚁',
    description: '上传叶片照片，AI（GLM-5V视觉模型）自动识别昆虫取食痕迹类型、推测昆虫种类。支持洞孔、边缘啃食、骨架化等7种痕迹类型。',
    ogImage: '/img/species.jpg'
  },
  lifecycle: {
    title: '🔄 生命循环 | 🦋 蝴蝶与蚂蚁',
    description: 'Maculinea arion大蓝蝶的5阶段交互式时间轴——从产卵到羽化，每一步都是进化的奇迹。了解特洛伊木马式的蚁巢寄生策略。',
    ogImage: '/img/larva.jpg'
  },
  mutualism: {
    title: '🤝 互作类型 | 🦋 蝴蝶与蚂蚁',
    description: '从互利共生到社会性寄生，了解灰蝶科与蚂蚁之间的三种关系模式：互利、兼性、寄生。75%的灰蝶物种涉及蚂蚁互作。',
    ogImage: '/img/meeting.jpg'
  },
  quiz: {
    title: '❓ 知识测验 | 🦋 蝴蝶与蚂蚁',
    description: '5道题目测试你对蝴蝶-蚂蚁互作的掌握程度——从基础概念到前沿研究。涵盖DNO蜜腺、CHC拟态、大蓝蝶保护等核心知识。',
    ogImage: '/img/nest.jpg'
  }
};

/**
 * 获取页面元数据
 * @param {string} pageSlug - 页面标识
 * @returns {Object} 元数据对象
 */
function getPageMeta(pageSlug) {
  return PAGE_META[pageSlug] || {
    title: `${SITE_NAME}`,
    description: '探索蝴蝶与蚂蚁之间最精妙的共生关系与进化奥秘——互动式科普教育网站。',
    ogImage: DEFAULT_OG_IMAGE
  };
}

/**
 * 转义 HTML 特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后字符串
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 生成完整的 meta/OG/Twitter 标签 HTML
 * @param {Object} meta - 页面元数据
 * @returns {string} HTML 字符串
 */
function generateMetaTags(meta) {
  const escapedDesc = escapeHtml(meta.description);
  const escapedTitle = escapeHtml(meta.title);
  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;

  return `<meta name="description" content="${escapedDesc}">
<meta property="og:title" content="${escapedTitle}">
<meta property="og:description" content="${escapedDesc}">
<meta property="og:image" content="${SITE_URL}${ogImage}">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapedTitle}">
<meta name="twitter:description" content="${escapedDesc}">
<meta name="twitter:image" content="${SITE_URL}${ogImage}">`;
}

/**
 * 生成 JSON-LD 结构化数据
 * @param {string} pageSlug - 页面标识
 * @returns {string} JSON-LD JSON 字符串
 */
function generateJsonLd(pageSlug) {
  const meta = getPageMeta(pageSlug);

  // 首页：WebSite schema
  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL + '/',
    description: meta.description,
    inLanguage: 'zh-CN'
  };

  if (pageSlug === 'index') {
    return JSON.stringify(webSiteSchema);
  }

  // 子页面：WebPage + BreadcrumbList
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL + '/' }
  ];

  const pageNames = {
    about: '关于', chemical: '化学通讯', gallery: '生态图鉴',
    lab: '虫痕鉴定', lifecycle: '生命循环', mutualism: '互作类型', quiz: '知识测验'
  };

  if (pageNames[pageSlug]) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: pageNames[pageSlug],
      item: `${SITE_URL}/${pageSlug}.html`
    });
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}/${pageSlug === 'index' ? '' : pageSlug + '.html'}`,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/' },
    inLanguage: 'zh-CN'
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  };

  return JSON.stringify([webPageSchema, breadcrumbSchema]);
}

module.exports = { PAGE_META, getPageMeta, generateMetaTags, generateJsonLd, escapeHtml };
