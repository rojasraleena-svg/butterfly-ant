/**
 * API Rate Limiting 中间件
 * 基于 IP 的内存限流器，保护 GLM-5V API 额度
 *
 * 环境变量：
 *   RATE_LIMIT_MAX=10          每窗口最大请求数（默认 10）
 *   RATE_LIMIT_WINDOW_MS=900000  窗口时间毫秒数（默认 15 分钟）
 */

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15分钟

const store = new Map(); // IP -> { count, resetTime }

// 延迟导入 logger 避免循环依赖
let _log;
function getLog() {
  if (!_log) {
    try { _log = require('../lib/logger').createLogger('rateLimit'); }
    catch { _log = { debug() {}, warn() {}, info() {} }; }
  }
  return _log;
}

/**
 * 创建限流中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件函数
 */
function createRateLimit(options = {}) {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || options.maxRequests || DEFAULT_MAX_REQUESTS;
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || options.windowMs || DEFAULT_WINDOW_MS;

  return function rateLimit(req, res, next) {
    const log = getLog();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      // 新窗口或过期，重置计数
      store.set(ip, { count: 1, resetTime: now + windowMs });
      log.debug('IP %s new window (1/%d in %ds)', ip, maxRequests, windowMs / 1000);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      log.warn('IP %s rate limited (%d/%d in window), retryAfter=%ds',
        ip, record.count, maxRequests, retryAfter
      );
      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter
      }).set('Retry-After', String(Math.max(1, retryAfter)));
    }

    log.debug('IP %s request %d/%d', ip, record.count, maxRequests);
    next();
  };
}

/**
 * 清理过期的记录（可定期调用以防止内存泄漏）
 */
function cleanupStore() {
  const now = Date.now();
  let cleaned = 0;
  for (const [ip, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    getLog().debug('cleanup: removed %d expired records (remaining: %d)', cleaned, store.size);
  }
}

// 每5分钟自动清理一次
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStore, 5 * 60 * 1000);
}

module.exports = { createRateLimit, cleanupStore };
