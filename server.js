require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.BUTTERFLY_PORT || 3242;
const BASE_DIR = __dirname;

// Zhipu GLM-5V Config
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-5v-turbo';

// Rate Limiting
const { createRateLimit } = require('./middleware/rateLimit');
const identifyBiteLimiter = createRateLimit();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(BASE_DIR, 'public'), {
  maxAge: '1h',
  etag: true,
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'butterfly-ant mutualism' });
});

// ===== 虫痕鉴定 API =====
app.post('/api/identify-bite', identifyBiteLimiter, async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // 提取base64数据
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // 调用GLM-5V进行虫痕识别
    // 基于以下学术分类框架：
    // [1] Labandeira CC (2002, 2007) DTM Damage Type Model — 古今植食性昆虫功能群分类体系
    //     Labandeira CC, Johnson KR, Wilf P (2002). PNAS 99(15):10241–10246.
    //     Labandeira CC (2007). The fossil record of plant-insect associations. Annu Rev Ecol Evol Syst 38:591–617.
    // [2] Root RB (1973) Functional Feeding Guild concept — 取食功能群理论奠基
    //     Root RB (1973). Organization of a plant-arthropod association in simple and diverse habitats. Ecol Monogr 43(1):95–124.
    // [3] Godfray HCJ (1984) Insect life histories & feeding strategies
    // [4] Coley PD & Barone JA (1996) Herbivory and plant defenses in tropical forests. Ecol Monogr 66(4):501–522.
    const systemPrompt = `你是一位昆虫学和植物生态学专家，专门研究昆虫对植物的取食痕迹（herbivory / feeding damage）。
你熟悉 Labandeira 的 DTM（Damage Type Model）取食痕迹分类体系和 Root-Godfray 功能群（feeding guild）分类框架。

【任务】根据用户上传的叶片照片，分析上面的昆虫取食痕迹，按指定JSON格式返回。

═══════════════════════════════════════
📐 分类标准（基于学术文献）
═══════════════════════════════════════

一、痕迹类型（Damage Types, 基于 Labandeira DTM 框架）

必须从以下8种中选择最匹配的一种：

┌──────┬──────────────────────────┬──────────────────────────────────────────┐
│ 代码 │ 中文名称                 │ 形态特征（诊断要点）                      │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ hole │ 洞孔式 (Hole feeding)   │ ● 贯穿叶片全层的圆形/不规则穿孔           │
│      │                          │ ● 边缘可能光滑（甲虫）或锯齿状（毛虫）      │
│      │                          │ ● 可分布在叶面任何位置                     │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ marg │ 边缘啃食 (Margin feeding)│ ● 从叶缘开始向内取食                      │
│      │                          │ ● 缺口呈半圆形、扇形或锯齿形               │
│      │                          │ ● 最常见的咀嚼式取食模式                   │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ skel │ 骨架化 (Skeletonization) │ ● 叶肉被选择性取食，完整保留叶脉网         │
│      │                          │ ● 呈现典型的"网状骨架"外观                  │
│      │                          │ ● 多为叶蜂幼虫或小型甲虫幼虫               │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ mine │ 潜叶隧道 (Leaf mining)   │ ● 在上下表皮之间形成蜿蜒/蛇形隧道          │
│      │                          │ ● 可见黑色粪便线（frass trail）             │
│      │                          │ ● 隧道逐渐加宽是潜叶蛾典型特征              │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ gall │ 虫瘿 (Galling)           │ ● 植物组织异常增生形成的球形/不规则肿块    │
│      │                          │ ● 表面可能有开口（瘿孔）                    │
│      │                          │ ● 是植物对昆虫刺激的反应性生长               │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ spot │ 斑点状 (Piercing/sucking)│ ● 小型失绿斑点或褪色区域（不穿透叶片）    │
│      │                          │ ● 可能伴随蜜露分泌（光亮黏性物质）          │
│      │                          │ ● 刺吸式口器特征                           │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ surf │ 表面刮擦 (Surface scrap.)│ ● 仅上表皮或浅层叶肉被刮除                │
│      │                          │ ● 形成半透明窗口状斑                       │
│      │                          │ ● 典型：蓟马、蛞蝓                         │
├──────┼──────────────────────────┼──────────────────────────────────────────┤
│ ?    │ 无法确定 (Unknown)       │ ● 图像模糊 / 痕迹不典型 / 多种混合        │
└──────┴──────────────────────────┴──────────────────────────────────────────┘

二、功能群（Feeding Guilds, 基于 Root 1973 + Godfray 1984 框架）

┌───────────┬──────────────────────────────────────────────────────────────┐
│ guild代码 │ 定义与代表类群                                                  │
├───────────┼──────────────────────────────────────────────────────────────┤
│ chewer    │ 咀嚼式口器（mandibulate）：鳞翅目幼虫、叶蜂、甲虫、直翅目等    │
│ sucker    │ 刺吸式口器（haustellate）：蚜虫、蝉、蝽象、叶螨、粉虱等       │
│ miner     │ 潜叶者（internal feeder）：潜叶蛾(Lepidoptera)、潜叶蝇(Diptera)、│
│           │ 潜叶蜂(Hymenoptera)                                         │
│ borer     │ 钻蛀者（stem/twig borer）：天牛、小蠹、木蠹蛾等              │
└───────────┴──────────────────────────────────────────────────────────────┘

三、置信度校准指南

⚠️ 请诚实评估不确定性！参考以下校准标准：
- 90-100%: 痕迹非常典型，所有关键特征都清晰可见且唯一指向一种类型
- 70-89%: 主要特征符合，但有少量模糊或次要特征不完全匹配
- 50-69%: 大致可判断但存在明显的不确定性（如光线差、图像模糊）
- <50%: 高度不确定，建议标注为 unknown 或请求更清晰的图片

═══════════════════════════════════════
📤 输出格式（严格JSON）
═══════════════════════════════════════

{
  "damage_type": "痕迹代码（hole|marg|skel|mine|gall|spot|surf|unknown）",
  "damage_type_cn": "中文名称",
  "confidence": 置信度整数(0-100),
  "feeding_guild": "功能群（chewer|sucker|miner|borer）",
  "insects_possible": [
    "具体到科或属的候选昆虫（如'凤蝶科幼虫'而非'毛虫'）",
    "至少2个候选，按可能性排序"
  ],
  "description": "详细描述痕迹特征（中文80-150字），需包含：形状→边缘→分布→与其他类型的区分依据",
  "ecological_context": "生态学背景（中文100-180字），包含：该取食策略的适应意义、在食物网中的位置、季节性规律",
  "key_features": ["3-6个可观察的具体形态特征", "每个应是可直接验证的视觉线索"],
  "plant_defense_response": "植物可能/已展现的防御反应（次生化合物、愈伤组织、VOC释放等）",
  "differential_diagnosis": "需要排除的其他类型及排除理由（2-3条）",
  "limitations": "本次鉴定的局限性说明（如图像质量、视角限制、需要额外信息等）"
}

【重要】如果同时存在多种痕迹类型，选择最主要的一种作为damage_type，在description中提及其他共存类型。`;

    const userPrompt = `请以昆虫学家和植物生态学家的双重身份，仔细分析这张叶片照片上的昆虫取食痕迹。${filename ? `文件名：${filename}` : ''}

【观察步骤 — 请逐步推理】

第一步：整体评估
- 图片质量和光照条件如何？
- 能看到完整的叶片吗？还是只有局部？
- 叶片形态是什么（单叶/复叶/针形/肉质）？

第二步：损伤特征提取
- 形状：穿孔/缺口/隧道/斑点/增生？
- 位置：叶面中部 vs 边缘 vs 叶脉附近？
- 边缘：光滑整齐 vs 不规则锯齿 vs 波浪状？
- 分布：集中一处 vs 分散多处 vs 规律排列？
- 特殊迹象：粪便颗粒(frass)？丝网？蜜露？变色晕圈？

第三步：分类型逐一比对（基于DTM标准）
- 对每种damage_type给出匹配度评分(1-5)
- 排除不可能的类型并记录排除理由

第四步：昆虫推断
- 结合痕迹类型+叶片形态+常见昆虫区系推断
- 给出具体到科的候选（中国境内常见种优先考虑）
- 注意：不同地区优势种群差异很大

第五步：综合判断与不确定性声明
- 最终判定 + 置信度 + 必须说明的局限性

请输出JSON格式的鉴定报告。`;

    const response = await fetch(ZHIPU_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: ZHIPU_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]}
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Zhipu API error:', response.status, errText);
      return res.status(500).json({ error: 'AI模型调用失败', details: errText });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // 尝试从返回中提取JSON
    let result;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch(e) {
        result = { raw_response: content, parse_error: true };
      }
    } else {
      result = { raw_response: content };
    }

    // 记录使用量
    console.log(`[虫痕鉴定] model=${data.model} usage=${JSON.stringify(data.usage || {})}`);

    res.json({
      success: true,
      result: result,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('[虫痕鉴定] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 示例图库信息
app.get('/api/damage-examples', (req, res) => {
  res.json({
    examples: [
      {
        type: 'hole',
        cn: '洞孔式 (Hole feeding)',
        icon: '⭕',
        desc: '贯穿叶片的圆形或不规则穿孔，边缘可能光滑（甲虫）或锯齿状（鳞翅目幼虫）。基于Labandeira DTM DT-Hole分类。',
        insects: ['鳞翅目幼虫(凤蝶/粉蝶/夜蛾)', '叶甲(Chrysomelidae)', '叶蜂幼虫(Tenthredinidae)'],
        guild: 'chewer'
      },
      {
        type: 'marg',
        cn: '边缘啃食 (Margin feeding)',
        icon: '📐',
        desc: '从叶缘向内取食，形成半圆形、扇形或锯齿状缺口。最常见的咀嚼式取食模式。DT-Margin。',
        insects: ['多种鳞翅目幼虫', '蝗虫/直翅目若虫', '叶蜂幼虫'],
        guild: 'chewer'
      },
      {
        type: 'skel',
        cn: '骨架化 (Skeletonization)',
        icon: '🕸️',
        desc: '选择性取食叶肉组织，保留完整叶脉网状结构。典型"窗格状"外观。DT-Skeletonization。',
        insects: ['叶蜂幼虫(Sawflies)', '某些叶甲幼虫', '象甲幼虫'],
        guild: 'chewer'
      },
      {
        type: 'mine',
        cn: '潜叶隧道 (Leaf mining)',
        icon: '〰️',
        desc: '在上下表皮之间取食叶肉，形成可见的蜿蜒隧道。常伴黑色粪便线(frass trail)。DT-Mining。',
        insects: ['潜叶蛾(Lyonetiidae/Gracillariidae)', '潜叶蝇(Agromyzidae)', '潜叶蜂(Tenthredinidae)'],
        guild: 'miner'
      },
      {
        type: 'gall',
        cn: '虫瘿 (Galling)',
        icon: '🔵',
        desc: '昆虫诱导植物组织异常增生形成的球形或不规则肿块。表面可能有瘿孔。DT-Galling。',
        insects: ['瘿蚊(Cecidomyiidae)', '瘿蜂(Cynipidae)', '瘿蚜(Aphididae部分)'],
        guild: 'sucker'
      },
      {
        type: 'spot',
        cn: '刺吸斑点 (Piercing/sucking)',
        icon: '🔘',
        desc: '刺吸式口器造成的小型失绿斑点或褪色区域。可能伴随蜜露分泌。DT-Piercing&sucking。',
        insects: ['蚜虫(Aphidoidea)', '蝉(Cicadidae)', '蝽象(Pentatomidae)', '叶螨(Tetranychidae)'],
        guild: 'sucker'
      },
      {
        type: 'surf',
        cn: '表面刮擦 (Surface scraping)',
        icon: '📏',
        desc: '刮去叶片上表皮或部分叶肉，形成半透明窗口状斑。DT-Surface feeding。',
        insects: ['蓟马(Thysanoptera)', '蛞蝓(Slug)', '蜗牛', '某些叶甲'],
        guild: 'chewer'
      }
    ]
  });
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const { generateSitemap } = require('./lib/sitemap');
  const baseUrl = process.env.SITE_BASE_URL || 'https://butterfly.gqy25.top';
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemap(baseUrl));
});

// 仅在直接运行时启动服务器（测试导入时不自动监听）
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦋 Butterfly-Ant Mutualism site running on http://0.0.0.0:${PORT}`);
    console.log(`🧪 Insect Bite Mark Identification API ready at /api/identify-bite`);
  });
}

module.exports = { app };
