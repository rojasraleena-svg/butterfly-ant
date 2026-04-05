/**
 * 统一日志系统 — 支持分级、颜色、时间戳、模块标记、请求上下文
 *
 * 环境变量：
 *   LOG_LEVEL=debug|info|warn|error  （默认 debug）
 *   LOG_JSON=true                   输出纯JSON（适合日志采集）
 *
 * 用法：
 *   const log = createLogger('server');
 *   log.info('hello %s', 'world');
 *
 *   // 请求上下文（自动附加 reqId 前缀）
 *   const reqLog = log.withContext({ reqId: 'a1b2c3', ip: '10.0.0.1' });
 *   reqLog.debug('processing...');
 */

const util = require('util');
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  // 级别颜色
  debug: '\x1b[90m',   // 灰色
  info:  '\x1b[36m',   // 青色
  warn:  '\x1b[33m',   // 黄色
  error: '\x1b[31m',   // 红色
  // 模块颜色（循环使用，便于区分）
  m0: '\x1b[35m', m1: '\x1b[34m', m2: '\x1b[32m', m3: '\x1b[36m',
  m4: '\x1b[33m', m5: '\x1b[35m', m6: '\x1b[34m', m7: '\x1b[32m',
  // 上下文颜色
  ctx: '\x1b[38;5;208m', // 橙色
};

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.debug;
const isJson = process.env.LOG_JSON === 'true';

// 模块名 → 颜色映射缓存
const moduleColors = new Map();
let colorIdx = 0;

function getModuleColor(mod) {
  if (!moduleColors.has(mod)) {
    moduleColors.set(mod, 'm' + (colorIdx++ % 8));
  }
  return COLORS[moduleColors.get(mod)];
}

function timestamp() {
  return new Date().toLocaleString('zh-CN', {
    hour12: false,
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

/** 生成短请求 ID (如 a1b2c3) */
function generateReqId() {
  return Math.random().toString(36).slice(2, 8);
}

/** 获取调用位置（文件名:行号），仅 error 级别使用 */
function getCallSite() {
  const stack = new Error().stack;
  if (!stack) return '';
  // 跳过 "Error"、log 函数、logger 方法、用户调用 — 取第4行
  const lines = stack.split('\n');
  for (let i = 3; i < Math.min(lines.length, 8); i++) {
    const match = lines[i].match(/\((.+?):(\d+):\d+\)|\s+at\s+(.+?):(\d+):\d+/);
    if (match) {
      const file = (match[1] || match[3]).replace(/\\/g, '/').replace(/.*\//, '');
      const line = match[2] || match[4];
      return `${file}:${line}`;
    }
  }
  return '';
}

/**
 * 创建模块专属 logger
 * @param {string} module - 模块名，如 'identify' / 'evolve'
 * @returns {{debug:Function,info:Function,warn:Function,error:Function,timer:Function,reqTimer:Function,withContext:Function}}
 */
function createLogger(module) {
  const modColor = getModuleColor(module);
  const prefix = isJson ? '' : `${modColor}[${module}]${COLORS.reset}`;

  function log(level, ...args) {
    if (LEVELS[level] < currentLevel) return;
    const lvlColor = COLORS[level];
    const ts = timestamp();

    // 提取末尾的上下文对象（如果有）
    let ctx = null;
    if (args.length > 0 && args[args.length - 1] && typeof args[args.length - 1] === 'object' && args[args.length - 1]._ctx) {
      ctx = args.pop()._ctx;
    }

    if (isJson) {
      const entry = {
        ts, level, module,
        ...(ctx ? { reqId: ctx.reqId, ip: ctx.ip } : {}),
        msg: args.map(formatArg),
        ...(level === 'error' ? { at: getCallSite() } : {}),
      };
      console.log(JSON.stringify(entry));
      return;
    }

    // 支持格式化字符串: log('info', 'hello %s', name)
    let formatted;
    if (args.length > 0 && typeof args[0] === 'string' && /%[sdjfoO]/.test(args[0])) {
      formatted = util.format(...args);
    } else {
      formatted = args.map(a => typeof a === 'object' ? formatObj(a) : a).join(' ');
    }

    // 构建上下文前缀
    const ctxPrefix = ctx ? `${COLORS.ctx}[${ctx.reqId || '??'}]${COLORS.reset} ` : '';

    // 错误级别附加调用位置
    const siteInfo = level === 'error' ? ` ${COLORS.dim}(${getCallSite()})${COLORS.reset}` : '';

    // 格式: [时间] [reqId] [模块] [级别] 内容 (位置)
    console.log(
      `${COLORS.dim}${ts}${COLORS.reset} ${ctxPrefix}${prefix} ${lvlColor}${level.toUpperCase().padEnd(5)}${COLORS.reset} ${formatted}${siteInfo}`
    );
  }

  function formatArg(arg) {
    if (typeof arg === 'string') return arg;
    try { return JSON.stringify(arg); } catch { return String(arg); }
  }

  function makeTimer(label) {
    const start = process.hrtime.bigint();
    const steps = [];
    let lastMark = start;

    return {
      /** 标记一个阶段 */
      mark(stepName) {
        const now = process.hrtime.bigint();
        const ms = Number(now - lastMark) / 1e6;
        steps.push({ name: stepName, ms: ms.toFixed(0) });
        lastMark = now;
        return this;
      },
      /** 停止计时并输出 */
      stop(extra) {
        const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
        const totalStr = totalMs.toFixed(0) + 'ms';
        const parts = [label + ':', totalStr];

        if (steps.length > 0) {
          const stepStrs = steps.map(s => `${s.name}=${s.ms}ms`);
          parts.push(`(${stepStrs.join(' ')})`);
        }
        if (extra) parts.push(extra);

        log('debug', parts.join(' '));
        return totalMs;
      },
      /** 仅读取耗时，不输出 */
      get elapsed() {
        return Number(process.hrtime.bigint() - start) / 1e6;
      },
      /** 获取各阶段耗时 */
      get stepsDetail() {
        return steps.slice();
      },
    };
  }

  const logger = {
    debug(...args) { log('debug', ...args); },
    info(...args)  { log('info', ...args); },
    warn(...args)  { log('warn', ...args); },
    error(...args) { log('error', ...args); },

    /**
     * 计时器 — 返回一个带 .stop() / .mark() 的对象
     * @param {string} label - 计时标签
     * @returns {{stop:Function,mark:Function,elapsed:number}}
     */
    timer(label) {
      return makeTimer(label);
    },

    /** 请求级计时器（自动打印 method + path） */
    reqTimer(req) {
      const label = `${req.method} ${req.path}`;
      const t = makeTimer(label);
      return {
        done(statusCode, extra) {
          t.stop(`→ ${statusCode}` + (extra ? ' ' + extra : ''));
        }
      };
    },

    /**
     * 创建带请求上下文的子 logger
     * 所有日志自动附加 [reqId] 前缀，JSON模式写入 reqId/ip 字段
     * @param {{reqId?: string, ip?: string}} ctx
     * @returns {typeof logger}
     */
    withContext(ctx) {
      const ctxData = { _ctx: ctx };
      return {
        debug(...args) { log('debug', ...args, ctxData); },
        info(...args)  { log('info', ...args, ctxData); },
        warn(...args)  { log('warn', ...args, ctxData); },
        error(...args) { log('error', ...args, ctxData); },
        timer: logger.timer.bind(logger),
        reqTimer: logger.reqTimer.bind(logger),
        withContext: logger.withContext.bind(logger),
      };
    },
  };

  return logger;
}

/** 格式化对象输出（带缩进和颜色） */
function formatObj(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const inner = obj.map(v => formatObj(v, indent + 2)).join(`,\n${pad}`);
    return `[\n${pad}  ${inner}\n${pad}]`;
  }

  const entries = Object.entries(obj).filter(([k]) => !k.startsWith('_'));
  if (entries.length === 0) return '{}';
  const inner = entries.map(([k, v]) => {
    const val = typeof v === 'string' && v.length > 120 ? v.slice(0, 120) + '...' : formatObj(v);
    return `${k}: ${val}`;
  }).join(`,\n${pad}`);
  return `{\n${pad}  ${inner}\n${pad}]`;
}

module.exports = { createLogger, generateReqId };
