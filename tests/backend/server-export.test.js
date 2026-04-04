import { describe, it, expect } from 'vitest';

describe('server.js 模块导出', () => {
  it('应该导出一个 express app 实例', () => {
    const { app } = require('../../server');
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });

  it('导出的 app 应该已注册关键路由', () => {
    const { app } = require('../../server');
    expect(app).toBeDefined();
  });
});
