import { describe, it, expect } from 'vitest';
import { generateNavHTML, NAV_ITEMS } from '../../lib/navigation';

describe('导航组件模块', () => {
  describe('NAV_ITEMS 配置', () => {
    it('应包含所有8个导航项', () => {
      expect(NAV_ITEMS.length).toBe(8);
    });

    it('每项应有 href, label, slug 属性', () => {
      for (const item of NAV_ITEMS) {
        expect(item).toHaveProperty('href');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('slug');
      }
    });
  });

  describe('generateNavHTML', () => {
    it('应返回包含 nav 标签的 HTML 字符串', () => {
      const html = generateNavHTML('index');
      expect(html).toContain('<nav');
      expect(html).toContain('</nav>');
    });

    it('应包含所有 8 个导航链接', () => {
      const html = generateNavHTML('index');
      for (const item of NAV_ITEMS) {
        expect(html).toContain(`href="${item.href}"`);
        expect(html).toContain(item.label);
      }
    });

    it('应包含 logo 链接', () => {
      const html = generateNavHTML('index');
      expect(html).toContain('/img/logo.svg');
    });

    it('首页 active 时 home 链接应有 active class', () => {
      const html = generateNavHTML('index');
      // 首页 slug 是 index，对应 href='/'
      expect(html).toMatch(/href="\/"[^>]*class="[^"]*active/);
    });

    it('about 页面 active 时 about 链接应有 active class', () => {
      const html = generateNavHTML('about');
      expect(html).toContain('href="about.html"');
      // about 链接应该有 active
      const aboutMatch = html.match(/href="about\.html"[^>]*class="([^"]*)"/);
      expect(aboutMatch).not.toBeNull();
      expect(aboutMatch[1]).toContain('active');
    });

    it('lab 页面 active 时 lab 链接应有 active class', () => {
      const html = generateNavHTML('lab');
      const labMatch = html.match(/href="lab\.html"[^>]*class="([^"]*)"/);
      expect(labMatch).not.toBeNull();
      expect(labMatch[1]).toContain('active');
    });

    it('同一时间只有一个 active class（排除当前页外的其他链接）', () => {
      const slugs = ['index', 'about', 'lab', 'lifecycle', 'chemical', 'gallery', 'quiz'];
      for (const slug of slugs) {
        const html = generateNavHTML(slug);
        const activeCount = (html.match(/\bactive\b/g) || []).length;
        expect(activeCount).toBe(1);
      }
    });

    it('nav 应有 aria-label 属性', () => {
      const html = generateNavHTML('index');
      expect(html).toContain('aria-label=');
    });
  });
});
