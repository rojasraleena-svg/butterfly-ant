# 蝴蝶与蚂蚁共生 - 昆虫咬痕识别与科普互动网站

基于 Express + 智谱 GLM-5V 视觉大模型的昆虫取食痕迹识别与科普网站，以蝴蝶与蚂蚁的共生关系为主线，融合 AI 图像识别、互动测验和生态学知识展示。

## 功能特性

- **AI 虫痕鉴定** — 上传叶片照片，调用 GLM-5V 视觉模型自动识别 8 类昆虫取食痕迹（洞孔式、边缘啃食、骨架化、潜叶隧道、虫瘿、斑点状、表面刮擦）
- **科普页面** — 共生关系、生命周期、化学通讯、图库展示等主题页面
- **互动测验** — 趣味问答游戏巩固知识
- **SEO 优化** — 自动生成 Sitemap、结构化数据注入
- **无障碍支持** — 符合 WCAG 标准的 a11y 检测
- **限流保护** — API 请求频率限制

## 技术栈

| 技术 | 用途 |
|------|------|
| Express 5 | Web 服务框架 |
| 智谱 GLM-5V | 视觉大模型（虫痕识别） |
| Vitest | 单元/集成测试 |
| Sharp | 图片构建与压缩 |
| JSDOM | 前端测试环境 |

## 快速开始

### 环境变量

```bash
# .env 文件
ZHIPU_API_KEY=your_zhipu_api_key
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/coding/paas/v4/chat/completions
ZHIPU_MODEL=glm-5v-turbo
BUTTERFLY_PORT=3242
SITE_BASE_URL=https://your-domain.com
```

### 安装与运行

```bash
npm install
npm run dev      # 开发模式（--watch 热重载）
npm start        # 生产模式
```

访问 `http://localhost:3242` 即可使用。

## 项目结构

```
butterfly-ant/
├── server.js              # Express 入口 & API 路由
├── public/                # 静态资源（HTML/CSS/JS/图片）
│   ├── index.html         # 首页
│   ├── lab.html           # AI 虫痕鉴定实验室
│   ├── quiz.html          # 互动测验
│   ├── mutualism.html     # 共生关系
│   ├── lifecycle.html     # 生命周期
│   ├── chemical.html      # 化学通讯
│   ├── gallery.html       # 图库
│   └── about.html         # 关于
├── lib/                   # 工具模块（SEO/Sitemap/a11y/导航）
├── middleware/            # 中间件（限流等）
├── scripts/               # 构建脚本（图片压缩/SEO 注入）
├── tests/                 # 测试套件
│   ├── accessibility/
│   ├── backend/
│   ├── frontend/
│   ├── build/
│   └── seo/
└── vitest.config.js       # 测试配置
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/identify-bite` | AI 虫痕鉴定（需上传 base64 图片） |
| GET  | `/api/damage-examples` | 获取痕迹类型示例列表 |
| GET  | `/api/health` | 健康检查 |
| GET  | `/sitemap.xml` | 站点地图 |

## 测试

```bash
npm test           # 运行全部测试
npm run test:watch # 监听模式
```

## License

ISC
