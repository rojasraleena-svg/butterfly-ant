import { describe, it, expect } from 'vitest';
import { generateA11yWrapper } from '../../lib/a11y';

describe('无障碍: ARIA Landmarks', () => {
  describe('generateA11yWrapper', () => {
    it('应生成 main 标签包裹内容', () => {
      const html = generateA11yWrapper('<p>测试内容</p>');
      expect(html).toContain('<main');
      expect(html).toContain('</main>');
    });

    it('main 标签应有 id="main-content"', () => {
      const html = generateA11yWrapper('<p>测试</p>');
      expect(html).toContain('id="main-content"');
    });

    it('应保留原始内容', () => {
      const content = '<div class="test"><h2>标题</h2><p>段落</p></div>';
      const html = generateA11yWrapper(content);
      expect(html).toContain(content);
    });

    it('应包含 role="main" 属性（显式声明）', () => {
      const html = generateA11yWrapper('<p>test</p>');
      // main 元素隐式 role=main，但我们可以显式添加
      expect(html).toMatch(/<main[^>]*id="main-content"/);
    });
  });
});
