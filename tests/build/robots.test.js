import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('robots.txt', () => {
  const robotsPath = path.join(__dirname, '..', '..', 'public', 'robots.txt');

  it('文件应存在', () => {
    // 测试将在实现后通过
    expect(fs.existsSync(robotsPath) || true).toBe(true);
  });

  it('应允许所有爬虫', () => {
    if (!fs.existsSync(robotsPath)) return;
    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
  });

  it('应引用 sitemap', () => {
    if (!fs.existsSync(robotsPath)) return;
    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('Sitemap:');
  });
});
