import { describe, it, expect } from 'vitest';
import { generateSkipLink } from '../../lib/a11y';

describe('无障碍: Skip Link', () => {
  describe('generateSkipLink', () => {
    it('应生成 a 标签作为 skip link', () => {
      const html = generateSkipLink();
      expect(html).toContain('<a');
      expect(html).toContain('</a>');
    });

    it('应指向 #main-content 目标', () => {
      const html = generateSkipLink();
      expect(html).toContain('href="#main-content"');
    });

    it('应包含跳转文本', () => {
      const html = generateSkipLink();
      expect(html).toContain('跳转到主要内容');
    });

    it('应有 skip-link CSS class', () => {
      const html = generateSkipLink();
      expect(html).toContain('class="skip-link"');
    });

    it('支持自定义目标 ID', () => {
      const html = generateSkipLink('custom-main');
      expect(html).toContain('href="#custom-main"');
    });
  });
});
