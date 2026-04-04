/**
 * 全局配置模块
 * 统一版本号和其他全局配置项（单一数据源）
 */
const pkg = require('../package.json');

const VERSION = pkg.version;

function getVersion() {
  return VERSION;
}

module.exports = { VERSION, getVersion };
