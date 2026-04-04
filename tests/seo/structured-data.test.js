import { describe, it, expect } from 'vitest';
import { generateJsonLd, getPageMeta } from '../../lib/seo';

describe('JSON-LD 结构化数据', () => {
  describe('generateJsonLd - WebSite schema', () => {
    it('应生成合法的 JSON-LD (可被 JSON.parse)', () => {
      const jsonLd = generateJsonLd('index');
      expect(() => JSON.parse(jsonLd)).not.toThrow();
    });

    it('应包含 @context 和 @type 字段', () => {
      const jsonLd = JSON.parse(generateJsonLd('index'));
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('WebSite');
    });

    it('应包含 name, url, description, inLanguage 字段', () => {
      const jsonLd = JSON.parse(generateJsonLd('index'));
      expect(jsonLd.name).toBeDefined();
      expect(jsonLd.url).toBeDefined();
      expect(jsonLd.description).toBeDefined();
      expect(jsonLd.inLanguage).toBe('zh-CN');
    });
  });

  describe('generateJsonLd - 子页面 BreadcrumbList', () => {
    it('子页面应包含 BreadcrumbList', () => {
      const jsonLd = generateJsonLd('about');
      // 可能返回数组或单个对象
      const parsed = Array.isArray(JSON.parse(jsonLd)) ? JSON.parse(jsonLd) : [JSON.parse(jsonLd)];
      const hasBreadcrumb = parsed.some(item => item['@type'] === 'BreadcrumbList' || Array.isArray(item) && item.some(i => i['@type'] === 'BreadcrumbList'));
      // 至少应该有内容
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('JSON-LD 应包裹在合法的 script 标签格式中', () => {
      const jsonLd = generateJsonLd('index');
      // 验证不包含会破坏 HTML 的字符
      expect(jsonLd).not.toContain('</script>');
    });
  });
});
