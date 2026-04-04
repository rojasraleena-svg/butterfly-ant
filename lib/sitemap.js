/**
 * Sitemap 生成模块
 * 生成符合 sitemaps.org 标准的 XML sitemap
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about.html', priority: '0.6', changefreq: 'monthly' },
  { loc: '/chemical.html', priority: '0.7', changefreq: 'monthly' },
  { loc: '/gallery.html', priority: '0.7', changefreq: 'monthly' },
  { loc: '/lab.html', priority: '0.8', changefreq: 'weekly' },
  { loc: '/lifecycle.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/mutualism.html', priority: '0.7', changefreq: 'monthly' },
  { loc: '/quiz.html', priority: '0.6', changefreq: 'monthly' },
];

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

/**
 * 生成 sitemap XML 字符串
 * @param {string} baseUrl - 网站基础 URL
 * @returns {string} XML 字符串
 */
function generateSitemap(baseUrl) {
  const today = formatDate(new Date());

  const urls = PAGES.map(page => {
    return `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * 写入 sitemap 文件
 * @param {string} outputPath - 输出文件路径
 * @param {string} baseUrl - 网站基础 URL
 * @returns {Promise<void>}
 */
async function writeSitemap(outputPath, baseUrl) {
  const xml = generateSitemap(baseUrl);
  // 确保目录存在
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, xml, 'utf-8');
}

module.exports = { generateSitemap, writeSitemap, PAGES };
