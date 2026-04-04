import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { app } from '../../server';
import { createRateLimit } from '../../middleware/rateLimit';

const request = supertest(app);

describe('API Rate Limiting 中间件', () => {
  // 创建一个独立的限流器实例用于单元测试（不影响全局app）
  function createTestLimiter(maxRequests = 3, windowMs = 10000) {
    const originalMax = process.env.RATE_LIMIT_MAX;
    const originalWindow = process.env.RATE_LIMIT_WINDOW_MS;
    process.env.RATE_LIMIT_MAX = String(maxRequests);
    process.env.RATE_LIMIT_WINDOW_MS = String(windowMs);
    const limiter = createRateLimit();
    process.env.RATE_LIMIT_MAX = originalMax;
    process.env.RATE_LIMIT_WINDOW_MS = originalWindow;
    return limiter;
  }

  describe('createRateLimit 工厂函数', () => {
    it('应返回一个中间件函数', () => {
      const limiter = createTestLimiter();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('限额内请求正常通过', () => {
    it('POST /api/identify-bite 在限额内应返回非429（因缺少数据返回400而非429）', async () => {
      // 发送3个请求（默认限制10次/15分钟），都不应被限流
      for (let i = 0; i < 3; i++) {
        const res = await request.post('/api/identify-bite').send({});
        expect(res.status).not.toBe(429);
      }
    });

    it('GET /api/health 不受限流影响', async () => {
      const res = await request.get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/damage-examples 不受限流影响', async () => {
      const res = await request.get('/api/damage-examples');
      expect(res.status).toBe(200);
      expect(res.body.examples).toBeDefined();
    });
  });

  describe('超限返回 429', () => {
    it('超过限额后应返回 429 状态码', async () => {
      // 注意：这个测试依赖已应用到 server.js 的限流中间件
      // 默认限制是 10 次/15分钟，我们无法在单次测试中轻松触发
      // 所以这里主要验证中间件本身的逻辑
      const limiter = createTestLimiter(2, 10000); // 2次/10秒用于测试

      // 模拟 req/res/next
      let callCount = 0;
      let lastStatus = 200;
      let lastBody = {};

      const mockReq = { ip: '127.0.0.1' };
      const mockRes = {
        status(code) { lastStatus = code; return this; },
        json(data) { lastBody = data; return this; },
        set() { return this; }
      };
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };

      // 第1次：通过
      limiter(mockReq, mockRes, mockNext);
      expect(nextCalled).toBe(true);
      nextCalled = false;

      // 第2次：通过
      limiter(mockReq, mockRes, mockNext);
      expect(nextCalled).toBe(true);
      nextCalled = false;

      // 第3次：超限 → 429
      limiter(mockReq, mockRes, mockNext);
      expect(nextCalled).toBe(false);
      expect(lastStatus).toBe(429);
      expect(lastBody.error).toBeDefined();
    });

    it('429 响应应包含 Retry-After 头信息', async () => {
      const limiter = createTestLimiter(1, 10000); // 1次即超限

      const mockReq = { ip: '192.168.1.1' };
      let headers = {};
      const mockRes = {
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
        set(key, val) { headers[key] = val; return this; }
      };
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };

      // 第1次通过
      limiter(mockReq, mockRes, mockNext);
      nextCalled = false;

      // 第2次超限
      limiter(mockReq, mockRes, mockNext);
      expect(nextCalled).toBe(false);
      expect(headers['Retry-After']).toBeDefined();
      expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    });
  });

  describe('不同 IP 独立计数', () => {
    it('IP A 超限后 IP B 仍可正常访问', () => {
      const limiter = createTestLimiter(1, 10000);

      let nextA = false, nextB = false;
      const nextFnA = () => { nextA = true; };
      const nextFnB = () => { nextB = true; };
      const baseRes = {
        status(c) { this.code = c; return this; },
        json(d) { return this; },
        set() { return this; }
      };

      // IP A 用完额度
      limiter({ ip: '10.0.0.1' }, { ...baseRes }, nextFnA);
      expect(nextA).toBe(true);
      nextA = false;
      limiter({ ip: '10.0.0.1' }, { ...baseRes }, nextFnA);
      expect(nextA).toBe(false); // A 被限流

      // IP B 应该还有额度
      limiter({ ip: '10.0.0.2' }, { ...baseRes }, nextFnB);
      expect(nextB).toBe(true); // B 正常通过
    });
  });

  describe('环境变量配置', () => {
    it('应支持 RATE_LIMIT_MAX 配置最大请求数', () => {
      const limiterLow = createTestLimiter(1, 10000);
      const limiterHigh = createTestLimiter(100, 10000);

      // 低限额：第2次就触发
      let blocked = false;
      const resStub = {
        status() { blocked = true; return this; },
        json() { return this; },
        set() { return this; }
      };
      limiterLow({ ip: 'test-low' }, resStub, () => {});
      limiterLow({ ip: 'test-low' }, resStub, () => {});
      expect(blocked).toBe(true);

      // 高限额：前2次不触发
      let passed = 0;
      limiterHigh({ ip: 'test-high' }, resStub, () => { passed++; });
      limiterHigh({ ip: 'test-high' }, resStub, () => { passed++; });
      expect(passed).toBe(2);
    });
  });
});
