import { describe, it, expect } from 'vitest';
import { getPageMeta, generateMetaTags } from '../../lib/seo';

describe('SEO 元数据模块', () => {
  describe('getPageMeta', () => {
    it('应为所有8个页面返回非空 metadata', () => {
      const pages = ['index', 'about', 'chemical', 'gallery', 'lab', 'lifecycle', 'mutualism', 'quiz'];
      for (const slug of pages) {
        const meta = getPageMeta(slug);
        expect(meta).toBeDefined();
        expect(meta.title).toBeDefined();
        expect(typeof meta.title).toBe('string');
        expect(meta.title.length).toBeGreaterThan(0);
      }
    });

    it('每个页面的 description 应至少50个字符', () => {
      const pages = ['index', 'about', 'chemical', 'gallery', 'lab', 'lifecycle', 'mutualism', 'quiz'];
      for (const slug of pages) {
        const meta = getPageMeta(slug);
        expect(meta.description.length).toBeGreaterThanOrEqual(50);
      }
    });

    it('每个页面应有 ogImage 路径', () => {
      const pages = ['index', 'about', 'chemical', 'gallery', 'lab', 'lifecycle', 'mutualism', 'quiz'];
      for (const slug of pages) {
        const meta = getPageMeta(slug);
        expect(meta.ogImage).toBeDefined();
        expect(meta.ogImage).toContain('/img/');
      }
    });

    it('未知页面应返回默认 metadata', () => {
      const meta = getPageMeta('nonexistent');
      expect(meta).toBeDefined();
      expect(meta.title).toBeDefined();
    });
  });

  describe('generateMetaTags', () => {
    it('应生成包含 meta description 的 HTML', () => {
      const meta = getPageMeta('index');
      const html = generateMetaTags(meta);
      expect(html).toContain('<meta name="description"');
      expect(html).toContain(meta.description);
    });

    it('应生成 Open Graph 标签', () => {
      const meta = getPageMeta('index');
      const html = generateMetaTags(meta);
      expect(html).toContain('<meta property="og:title"');
      expect(html).toContain('<meta property="og:description"');
      expect(html).toContain('<meta property="og:image"');
      expect(html).toContain('<meta property="og:type" content="website"');
    });

    it('应生成 Twitter Card 标签', () => {
      const meta = getPageMeta('index');
      const html = generateMetaTags(meta);
      expect(html).toContain('<meta name="twitter:card"');
      expect(html).toContain('summary_large_image');
    });

    it('应正确转义 HTML 特殊字符', () => {
      const meta = { title: 'Test "quotes" & <angles>', description: 'It\'s a "test"', ogImage: '/img/test.jpg' };
      const html = generateMetaTags(meta);
      // 不应包含未转义的引号破坏属性
      expect(html).toContain('&quot;');
      expect(html).toContain('&amp;');
    });
  });
});
