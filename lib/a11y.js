/**
 * 无障碍(a11y)辅助模块
 * 生成 skip-link、ARIA landmarks 等无障碍增强元素
 */

/**
 * 生成 skip-link（跳转到主要内容）HTML
 * @param {string} targetId - 目标元素的 ID，默认 'main-content'
 * @returns {string} skip-link HTML 字符串
 */
function generateSkipLink(targetId = 'main-content') {
  return `<a href="#${targetId}" class="skip-link">跳转到主要内容</a>`;
}

/**
 * 生成 main 内容包裹器
 * @param {string} content - 页面主体内容 HTML
 * @returns {string} 包裹后的 HTML 字符串
 */
function generateA11yWrapper(content) {
  return `<main id="main-content" role="main">\n${content}\n</main>`;
}

/**
 * 获取 skip-link 的 CSS 样式
 * @returns {string} CSS 字符串
 */
function getSkipLinkCSS() {
  return `.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--primary, #1a237e);
  color: #fff;
  text-decoration: none;
  border-radius: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}
.skip-link:focus {
  top: 0;
}`;
}

module.exports = { generateSkipLink, generateA11yWrapper, getSkipLinkCSS };
