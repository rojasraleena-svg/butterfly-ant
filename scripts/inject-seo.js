/**
 * SEO 注入脚本
 * 为所有 HTML 页面的 <head> 中注入 meta/OG/TC 标签和 JSON-LD 结构化数据
 */

const fs = require('fs');
const path = require('path');
const { getPageMeta, generateMetaTags, generateJsonLd } = require('../lib/seo');
const { generateSkipLink } = require('../lib/a11y');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const PAGE_MAP = {
  'index.html': 'index',
  'about.html': 'about',
  'chemical.html': 'chemical',
  'gallery.html': 'gallery',
  'lab.html': 'lab',
  'lifecycle.html': 'lifecycle',
  'mutualism.html': 'mutualism',
  'quiz.html': 'quiz'
};

function injectBeforeHeadClose(html, content) {
  return html.replace('</head>', content + '\n</head>');
}

function injectAfterBodyOpen(html, content) {
  return html.replace('<body>', '<body>\n' + content);
}

function main() {
  let count = 0;

  for (var filename in PAGE_MAP) {
    if (!Object.prototype.hasOwnProperty.call(PAGE_MAP, filename)) continue;
    var slug = PAGE_MAP[filename];
    var filePath = path.join(PUBLIC_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.warn('[inject-seo] Skip: ' + filename + ' not found');
      continue;
    }

    var html = fs.readFileSync(filePath, 'utf-8');
    var meta = getPageMeta(slug);

    // 1. Inject Meta + OG + Twitter Card
    var metaTags = generateMetaTags(meta);
    var metaHtml = '  ' + metaTags.split('\n').join('\n  ');
    if (html.indexOf('<meta name="description"') === -1) {
      html = injectBeforeHeadClose(html, metaHtml);
    }

    // 2. Inject JSON-LD structured data
    var jsonLd = generateJsonLd(slug);
    var jsonLdHtml = '  <script type="application/ld+json">' + jsonLd + '</script>';
    if (html.indexOf('application/ld+json') === -1) {
      html = injectBeforeHeadClose(html, jsonLdHtml);
    }

    // 3. Inject skip-link for accessibility
    var skipLink = generateSkipLink();
    if (html.indexOf('class="skip-link"') === -1) {
      html = injectAfterBodyOpen(html, '  ' + skipLink);
    }

    // 4. Add aria-label to nav if missing
    if (html.indexOf('<nav class="nav">') !== -1 && html.indexOf('aria-label=') === -1) {
      html = html.replace(
        '<nav class="nav">',
        '<nav class="nav" aria-label="主导航">'
      );
    }

    fs.writeFileSync(filePath, html, 'utf-8');
    count++;
    console.log('[inject-seo] OK: ' + filename + ' (' + slug + ')');
  }

  console.log('\n[inject-seo] Done! ' + count + ' pages processed.');
}

if (require.main === module) {
  main();
}

module.exports = { main };
