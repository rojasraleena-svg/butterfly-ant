const path = require('path');
const fs = require('fs');
const BASE_DIR = '/workspace/projects/workspace/butterfly-ant';
const express = require('express');
const app = express();
const PORT = 3242;

// Zhipu GLM-5V Config
const ZHIPU_API_KEY = 'c83862d99aff49f9b02bc9411a6500f7.hUheJE2STvRJhXVB';
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
const ZHIPU_MODEL = 'glm-5v-turbo';

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
app.post('/api/identify-bite', async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // 提取base64数据
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // 调用GLM-5V进行虫痕识别
    const systemPrompt = `你是一位昆虫学和植物生态学专家，专门研究昆虫对植物的取食痕迹（herbivory/feeding damage）。你的任务是根据用户上传的叶片照片，分析上面的昆虫咬痕/取食痕迹。

请严格按以下JSON格式返回分析结果（不要返回其他内容）：
{
  "damage_type": "痕迹类型（必须是以下之一：hole|margin|skeletonization|mining|gall|spot|surface_scraping|unknown）",
  "damage_type_cn": "中文名称",
  "confidence": 置信度(0-100),
  "feeding_guild": "取食功能群（chewer|sucker|miner|borer）",
  "insects_possible": ["可能的昆虫1", "可能的昆虫2"],
  "description": "详细描述痕迹特征（中文，50-100字）",
  "ecological_context": "生态学背景解释（中文，80-150字）",
  "key_features": ["特征1", "特征2", "特征3"],
  "plant_defense_response": "植物的防御反应描述"
}

痕迹类型说明：
- hole: 洞孔式（贯穿叶片的圆形或不规则穿孔）
- margin: 边缘啃食（从叶缘向内取食）
- skeletonization: 骨架化（只吃叶肉留下叶脉网状结构）
- mining: 潜叶（在叶肉内部形成蜿蜒隧道）
- gall: 虫瘿（植物组织异常增生形成的肿块）
- spot: 斑点状（刺吸式口器造成的失绿斑点）
- surface_scraping: 表面刮擦（只刮去上表皮或部分叶肉）
- unknown: 无法确定`;

    const userPrompt = `请分析这张叶片照片上的昆虫取食痕迹。${filename ? `文件名：${filename}` : ''} 
仔细观察：
1. 叶片上的损伤形状、位置、分布模式
2. 损伤边缘的特征（光滑/不规则/锯齿状）
3. 是否有残留的叶脉
4. 是否有隧道状痕迹
5. 是否有组织增生（虫瘿）

给出你的专业判断。`;

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
        cn: '洞孔式',
        icon: '⭕',
        desc: '贯穿叶片的圆形或不规则穿孔，边缘可能光滑或粗糙',
        insects: ['鳞翅目幼虫(毛虫)', '甲虫成虫/幼虫', '叶蜂幼虫'],
        guild: 'chewer'
      },
      {
        type: 'margin',
        cn: '边缘啃食',
        icon: '📐',
        desc: '从叶缘向内取食，形成半圆形或锯齿状缺口',
        insects: ['多种咀嚼式口器昆虫'],
        guild: 'chewer'
      },
      {
        type: 'skeletonization',
        cn: '骨架化',
        icon: '🕸️',
        desc: '选择性取食叶肉组织，保留完整叶脉网状结构',
        insects: ['某些甲虫幼虫', '叶蜂幼虫'],
        guild: 'chewer'
      },
      {
        type: 'mining',
        cn: '潜叶隧道',
        icon: '〰️',
        desc: '在上下表皮之间取食叶肉，形成可见的蜿蜒隧道',
        insects: ['潜叶蛾', '潜叶蝇', '潜叶蜂'],
        guild: 'miner'
      },
      {
        type: 'gall',
        cn: '虫瘿',
        icon: '🔵',
        desc: '昆虫诱导植物组织异常增生形成的球形或不规则肿块',
        insects: ['瘿蚊', '瘿蜂', '蚜虫(部分)'],
        guild: 'sucker'
      },
      {
        type: 'spot',
        cn: '斑点状',
        icon: '·',
        desc: '刺吸式口器造成的小型失绿斑点或褪色区域',
        insects: ['蚜虫', '蝉', '蝽象', '叶螨'],
        guild: 'sucker'
      },
      {
        type: 'surface_scraping',
        cn: '表面刮擦',
        icon: '📏',
        desc: '刮去叶片上表皮或部分叶肉，形成透明斑或浅色区域',
        insects: ['蓟马', '蛞蝓', '某些甲虫'],
        guild: 'chewer'
      }
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦋 Butterfly-Ant Mutualism site running on http://0.0.0.0:${PORT}`);
  console.log(`🧪 Insect Bite Mark Identification API ready at /api/identify-bite`);
});
