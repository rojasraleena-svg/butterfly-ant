const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'public', 'img');

const JPEG_FILES = [
  'hero.jpg', 'egg.jpg', 'larva.jpg', 'carry.jpg',
  'nest.jpg', 'emerge.jpg', 'chemical.jpg', 'meadow.jpg',
  'species.jpg', 'meeting.jpg'
];

/**
 * 将单张 JPEG 转换为 WebP 格式
 * @param {string} filePath - JPEG 文件完整路径
 * @returns {Promise<string>} 输出 WebP 文件路径
 */
async function convertToWebP(filePath) {
  const outputPath = filePath.replace(/\.jpg$/, '.webp');
  await sharp(filePath)
    .webp({ quality: 80, effort: 6 })
    .toFile(outputPath);
  return outputPath;
}

/**
 * 生成响应式 srcset 属性值
 * @param {string} name - 图片名称（不含扩展名）
 * @param {string} imgBase - 图片基础路径
 * @param {number[]} widths - 宽度列表
 * @returns {string} srcset 字符串
 */
function generateResponsiveSrcset(name, imgBase, widths = [400, 800, 1200]) {
  return widths
    .map(w => `${imgBase}/${name}.webp ${w}w`)
    .join(', ');
}

/**
 * 生成 <picture> 标签 HTML，包含 WebP source + JPEG fallback
 * @param {string} name - 图片名称（不含扩展名）
 * @param {string} alt - alt 文本
 * @param {string} imgBase - 图片基础路径
 * @param {Object} opts - 额外选项
 * @returns {string} picture HTML 字符串
 */
function generatePictureTag(name, alt, imgBase = '/img', opts = {}) {
  const { className = '', id = '', sizes = '(max-width: 768px) 100vw, 800px' } = opts;
  const srcset = generateResponsiveSrcset(name, imgBase, [400, 800, 1200]);

  return `<picture${id ? ` id="${id}"` : ''}${className ? ` class="${className}"` : ''}>
  <source type="image/webp" srcset="${srcset}" sizes="${sizes}">
  <source type="image/jpeg" srcset="${imgBase}/${name}.jpg" sizes="${sizes}">
  <img src="${imgBase}/${name}.jpg" alt="${alt}" loading="lazy" decoding="async">
</picture>`;
}

/**
 * 批量转换所有 JPEG 为 WebP
 * @returns {Promise<void>}
 */
async function buildImages() {
  for (const file of JPEG_FILES) {
    const inputPath = path.join(IMG_DIR, file);
    if (!fs.existsSync(inputPath)) {
      console.warn(`[build-images] 跳过不存在的文件: ${file}`);
      continue;
    }
    await convertToWebP(inputPath);
    console.log(`[build-images] ✓ ${file} → ${file.replace('.jpg', '.webp')}`);
  }
}

module.exports = { convertToWebP, generatePictureTag, generateResponsiveSrcset, buildImages };

if (require.main === module) {
  buildImages()
    .then(() => console.log('[build-images] 全部完成'))
    .catch(err => { console.error('[build-images] 错误:', err); process.exit(1); });
}
