import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { convertToWebP, generatePictureTag, generateResponsiveSrcset, buildImages } from '../../scripts/build-images';

const IMG_DIR = path.join(__dirname, '..', '..', 'public', 'img');

const JPEG_FILES = [
  'hero.jpg', 'egg.jpg', 'larva.jpg', 'carry.jpg',
  'nest.jpg', 'emerge.jpg', 'chemical.jpg', 'meadow.jpg',
  'species.jpg', 'meeting.jpg'
];

describe('图片 WebP 转换', () => {
  describe('convertToWebP', () => {
    it('应该将 JPEG 转换为 WebP 且输出文件存在', async () => {
      const inputPath = path.join(IMG_DIR, 'hero.jpg');
      const outputPath = await convertToWebP(inputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      expect(outputPath.endsWith('.webp')).toBe(true);
    }, 15000);

    it('WebP 文件大小应小于原始 JPEG (至少缩小30%)', async () => {
      const inputPath = path.join(IMG_DIR, 'hero.jpg');
      const outputPath = await convertToWebP(inputPath);
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;
      expect(outputSize).toBeLessThan(inputSize * 0.7);
    }, 15000);

    it('应该处理所有 10 张 JPEG 并生成 WebP 文件', async () => {
      for (const file of JPEG_FILES) {
        const inputPath = path.join(IMG_DIR, file);
        if (!fs.existsSync(inputPath)) continue;
        const webpFile = file.replace('.jpg', '.webp');
        const webpPath = path.join(IMG_DIR, webpFile);
        // 确保文件已被转换（前面的测试或 buildImages 已转换）
        if (!fs.existsSync(webpPath)) {
          await convertToWebP(inputPath);
        }
        expect(fs.existsSync(webpPath)).toBe(true);
      }
    }, 30000);
  });

  describe('generatePictureTag', () => {
    it('应生成包含 WebP source 和 JPEG fallback 的 picture 标签', () => {
      const html = generatePictureTag('hero', 'Hero background image', '/img');
      expect(html).toContain('<picture>');
      expect(html).toContain('type="image/webp"');
      expect(html).toContain('.webp');
      expect(html).toContain('<img');
      expect(html).toContain('alt="Hero background image"');
      expect(html).toContain('</picture>');
    });

    it('应包含 loading="lazy" 和 decoding="async" 属性', () => {
      const html = generatePictureTag('hero', 'test', '/img');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('decoding="async"');
    });
  });

  describe('generateResponsiveSrcset', () => {
    it('应生成带宽度描述符的 srcset', () => {
      const srcset = generateResponsiveSrcset('hero', '/img', [400, 800, 1200]);
      expect(srcset).toContain('400w');
      expect(srcset).toContain('800w');
      expect(srcset).toContain('1200w');
      expect(srcset).toContain('.webp');
    });
  });

  describe('buildImages 幂等性', () => {
    it('运行两次不应报错', async () => {
      await expect(buildImages()).resolves.not.toThrow();
      await expect(buildImages()).resolves.not.toThrow();
    }, 60000);
  });
});
