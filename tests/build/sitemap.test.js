import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateSitemap, writeSitemap, PAGES } from '../../lib/sitemap';

describe('Sitemap 生成', () => {
  describe('generateSitemap', () => {
    it('应生成合法的 XML（包含 urlset 声明）', () => {
      const xml = generateSitemap('http://localhost:3242');
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('</urlset>');
    });

    it('应包含全部 8 个页面 URL', () => {
      const xml = generateSitemap('http://localhost:3242');
      expect(xml).toContain('<loc>http://localhost:3242/</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/about.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/chemical.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/gallery.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/lab.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/lifecycle.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/mutualism.html</loc>');
      expect(xml).toContain('<loc>http://localhost:3242/quiz.html</loc>');
    });

    it('每个 URL 应有 lastmod、changefreq、priority', () => {
      const xml = generateSitemap('http://localhost:3242');
      // 检查至少有 lastmod 和 changefreq
      expect(xml).toContain('<lastmod>');
      expect(xml).toContain('<changefreq>');
      expect(xml).toContain('<priority>');
    });

    it('首页 priority 应为 1.0', () => {
      const xml = generateSitemap('http://localhost:3242');
      // 首页 URL 后面应该紧跟 priority 1.0
      expect(xml).toMatch(/<loc>http:\/\/localhost:3242\/<\/loc>\s*<lastmod>[^<]+<\/lastmod>\s*<changefreq>[^<]+<\/changefreq>\s*<priority>1\.0<\/priority>/);
    });

    it('应支持自定义 base URL', () => {
      const customUrl = 'https://example.com';
      const xml = generateSitemap(customUrl);
      expect(xml).toContain(`<loc>${customUrl}/</loc>`);
    });
  });

  describe('writeSitemap', () => {
    it('应将 sitemap 写入指定路径', async () => {
      const tmpPath = path.join(__dirname, '..', '..', 'public', 'sitemap.xml');
      await writeSitemap(tmpPath, 'http://localhost:3242');
      expect(fs.existsSync(tmpPath)).toBe(true);
      const content = fs.readFileSync(tmpPath, 'utf-8');
      expect(content).toContain('<urlset');
    }, 10000);
  });

  describe('PAGES 配置', () => {
    it('应包含 8 个页面配置', () => {
      expect(PAGES.length).toBe(8);
    });

    it('每项应有 loc, priority, changefreq', () => {
      for (const page of PAGES) {
        expect(page).toHaveProperty('loc');
        expect(page).toHaveProperty('priority');
        expect(page).toHaveProperty('changefreq');
      }
    });
  });
});
