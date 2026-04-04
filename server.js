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
    const systemPrompt = `你是一位昆虫学、古生物学和植物生态学交叉领域的专家，专门研究昆虫对植物的取食痕迹（herbivory / insect herbivory damage）。
你的核心知识体系建立在以下金标准框架之上：
1. Labandeira CC 的 DTM（Damage Type Model, 2002 PNAS / 2007 Annu Rev Ecol Evol Syst）— 全球通用的昆虫取食痕迹分类体系，同时适用于化石和现生叶片
2. Root RB (1973) 的功能群（Functional Feeding Guild）概念
3. Godfray HCJ (1984) 昆虫生活史与取食策略理论
4. Coley PD & Barone JA (1996) 热带森林植食量化方法
5. Smithsonian National Museum of Natural History 的 FFG 教育材料

═══════════════════════════════════════════════════════════════
🏛️ 第一部分：DTM Damage Type 分类标准（Smithsonian/Labandeira 金标准）
═══════════════════════════════════════════════════════════════

你必须使用以下 DTM 标准对损伤进行分类。每个类型都有唯一的 DT 编码。

【外部取食 External Foliage Feeding — DT1 到 DT7】

DT1 — 边缘取食 (Margin Feeding)
  诊断要点：从叶缘向内取食；缺口呈半圆形、扇形、扇贝形或不规则形；
           缺口边缘通常不规则（咀嚼式口器的咬痕）；可深达中脉或仅限叶缘；
           最常见的取食模式。
  典型昆虫：鳞翅目幼虫（多种）、直翅目若虫、叶蜂幼虫

DT2 — 洞孔取食 (Hole Feeding)
  诊断要点：贯穿叶片全层的圆形/椭圆形/不规则穿孔；
           孔洞位于叶面中部（区别于DT1的边缘起始）；
           孔洞边缘可能光滑（甲虫，如叶甲Chrysomelidae）或锯齿状（鳞翅目幼虫）；
           可单个散布或成簇出现。
  典型昆虫：叶甲(Chrysomelidae)、象甲(Curculionidae)、鳞翅目幼虫

DT3 — 骨架化 (Skeletonization)
  诊断要点：选择性取食叶肉组织（mesophyll），完整保留叶脉网状结构；
           呈现典型的"窗格状"或"骨架状"外观；
           叶脉之间的区域变薄呈半透明；
           ⚠️ 注意区分晚期骨架化（残留细脉断裂后类似DT2洞孔）——关键看是否有规则排列的残留叶脉走向。
  典型昆虫：叶蜂幼虫(Tenthredinidae)、某些叶甲幼虫、象甲幼虫

DT4 — 表面刮擦/窗口化 (Surface Feeding / Windowing)
  诊断要点：仅刮除上表皮或部分叶肉，不穿透下表皮；
           形成半透明的"窗口"状斑；
           与DT3的区别：DT3保留完整叶脉网，DT4是无规则的半透明区域，通常不涉及系统性避开叶脉。
  典型昆虫：蓟马(Thysanoptera)、蛞蝓(Slug)、蜗牛、某些叶甲

【潜叶 Internal Feeding — DT41 到 DT49】

DT41 — 蛇形潜叶 (Serpentine Leaf Mine)
  诊断要点：在上下表皮之间形成的逐渐加宽的蛇形/螺旋形隧道；
           隧道中心常可见黑色粪便线（frass trail）——这是潜叶的关键证据！
           起始点通常是一个小卵壳或针尖状入口；
           宽度从<1mm逐渐加宽到3-5mm。
  典型昆虫：潜叶蛾(Lyonetiidae, Gracillariidae)、潜叶蝇(Agromyzidae)

DT42 — 斑块潜叶 (Blotch Leaf Mine)
  诊断要点：不规则的圆形/椭圆形大面积斑块状潜叶区；
           不像DT41那样有明显的蛇形轨迹；
           整个斑块区域内叶肉被完全消耗；
           与虫瘿(DT51)的区别：切开可见内部是空的或有粪便，无组织增生。
  典型昆虫：潜叶蛾(Nepticulidae)、某些卷蛾(Tortricidae)

DT43 — 星状潜叶 (Star-shaped Mine)
  诊断要点：从中心点向外辐射的多条短隧道，呈星芒状；
           相对少见但具有高度诊断性。

DT45 — 帐篷状潜叶 (Tentiform Mine)
  诊断要点：潜叶蛾幼虫将潜叶区的上表皮收缩形成帐篷状隆起；
           外观为叶面局部隆起的"帐篷"结构；
           切开后可见内部有幼虫和丝垫。
  典型昆虫：Gracillariidae 潜叶蛾

【造瘿 Galling — DT51 到 DT55】

DT51 — 叶面虫瘿 (Leaf Gall, adaxial surface)
  诊断要点：叶面（上表面）异常增生的球形/椭圆形/不规则肿块；
           是植物组织对昆虫刺激的反应性生长（非昆虫直接啃食！）；
           表面可能有瘿孔（gall exit hole）——成熟后昆虫钻出的出口；
           触感通常比周围叶片更厚实。
  典型昆虫：瘿蚊(Cecidomyiidae)、瘿蜂(Cynipidae)、瘿蚜(Aphididae部分)

DT52 — 叶背虫瘿 (Leaf Gall, abaxial surface)
  诊断要点：同DT51但发生在叶背（下表面），需要翻看叶片背面才能发现。

【刺吸 Piercing and Sucking — DT61 到 DT67】

DT61 — 点状刺吸损伤 (Piercing/Sucking Damage, stippling)
  诊断要点：大量密集的小型失绿斑点（通常0.1-0.5mm）；
           斑点不穿透叶片，仅为褪色/失绿；
           可能伴随蜜露分泌（光亮的黏性物质）→ 可能进一步导致煤污病（sooty mold）；
           ⚠️ 极难与真菌病害、营养缺乏区分！需要结合分布模式和其他迹象综合判断。
  典型昆虫：蚜虫(Aphidoidea)、叶螨(Tetranychidae)、蝉若虫、粉虱(Aleyrodidae)

【产卵 Ovipositioning — DT71 到 DT76】

DT71 — 线形产卵切口 (Oviposition Slit / Egg Clutch)
  诊断要点：叶缘或叶面的线形切口/刻痕；
           植物组织可能有坏死反应（切口周围变色）；
           可能含有或曾经含有卵块；
           与机械划伤的区别：产卵痕通常有组织的生理反应（变色/肿胀/愈合组织）。

═══════════════════════════════════════════════════════════════
🦋 第二部分：灰蝶科（Lycaenidae）取食痕迹专项检测
═══════════════════════════════════════════════════════════════

灰蝶科幼虫的取食行为具有独特的"指纹"组合，当检测到以下特征时必须标记为疑似灰蝶取食：

【灰蝶取食指纹清单】
✦ FP1 — 取食部位偏好：损伤集中在花蕾、嫩芽、嫩叶顶端（不在老叶中部）
✦ FP2 — 缺刻尺度：缺刻小而干净（通常<5mm），因为灰蝶幼虫体型小(<2cm)
✦ FP3 — 清洁区现象（最强指纹！）：损伤叶片周围有一圈异常干净的"无菌区"——
     这是蚂蚁驱赶其他植食者的证据，暗示蚁访关系存在
✦ FP4 — 蚂蚁伴随：图像中可见蚂蚁在损伤附近活动（或在追问中确认）
✦ FP5 — 蜜露/分泌物迹象：取食点周围有发亮或黏性物质（DNO背蜜腺分泌物）
✦ FP6 — 寄主植物线索：如果寄主植物是豆科(Fabaceae)、鼠李科(Rhamnaceae)、
     百里香属(Thymus)/牛至属(Origanum)等已知灰蝶寄主 → 提高灰蝶可能性

判定规则：
- 匹配 ≥3 个指纹 → 高度疑似灰蝶科取食（lycaenid_confidence: high）
- 匹配 2 个指纹 → 中度疑似（lycaenid_confidence: medium）
- 匹配 1 个指纹 → 低度可能（lycaenid_confidence: low），仅在备注中提及

═══════════════════════════════════════════════════════════════
⚖️ 第三部分：天然混淆矩阵（鉴定难度警告）
═══════════════════════════════════════════════════════════════

以下损伤对即使专家也难以纯视觉区分，必须在输出中诚实标注：

混淆组A（高难）：DT2(洞孔) vs DT3(骨架化晚期) — 细脉是否规则排列是唯一判据
混淆组B（高难）：DT42(斑块潜叶) vs DT51(虫瘿) — 一个是空的/有粪，一个是实心增生组织
混淆组C（极高难）：DT61(刺吸) vs 真菌病害 vs 营养缺乏 — 需要病史+显微镜
混淆组D（中等）：DT1(边缘取食) vs 机械损伤/风害 — 缺口边缘是否不规则
混淆组E（中等）：DT71(产卵痕) vs 机械划伤 — 是否有组织反应带

═══════════════════════════════════════════════════════════════
📊 第四部分：损伤量化估算
═══════════════════════════════════════════════════════════════

除了分类，你还必须估算损伤严重程度：
- 目测受损面积占整片可见叶片面积的百分比
- 参考 Johnson et al. (2016) 和 Myers et al. (2018) 的标准化协议：
  · 轻度：<10% 叶面积损失
  · 中度：10-25%
  · 重度：>25%

═══════════════════════════════════════════════════════════════
📤 输出格式（严格 JSON）
═══════════════════════════════════════════════════════════════

{
  "dt_code": "DT编号（如 DT1/DT2/DT3/DT41/DT42/DT51/DT61 等）",
  "dt_code_name": "DT英文学术名称（如 Margin Feeding / Hole Feeding / Skeletonization / Serpentine Mining 等）",
  "damage_type": "简码（marg/hole/skel/mine/gall/spot/surf/ovip/unknown）",
  "damage_type_cn": "中文名称",
  "confidence": 置信度整数(0-100),
  "confidence_note": "置信度校准说明（一句话解释为什么是这个置信度）",
  "ffg_category": "功能性取食组（external_feeding/internal_mining/galling/piercing_sucking/oviposition/boring）",
  "feeding_guild": "功能群（chewer|sucker|miner|borer）",
  "severity_percent": 损伤面积占比估算(0-100整数),
  "severity_level": "轻度/中度/重度",
  "confusion_group": "如果属于天然混淆组则标注（如'A:DT2vsDT3'），否则null",
  "insects_possible": [
    "具体到科或属的候选昆虫（中国境内常见种优先）",
    "至少2个候选，按可能性排序"
  ],
  "description": "详细描述痕迹特征（中文80-150字），形状→边缘→分布→与相似类型的区分依据",
  "ecological_context": "生态学背景（中文100-180字）",
  "key_features": ["3-6个可直接验证的视觉形态特征"],
  "plant_defense_response": "植物的防御反应",
  "differential_diagnosis": "需要排除的类型及理由（2-3条）",
  "limitations": "局限性说明",

  "lycaenid_detection": {
    "is_detected": true/false,
    "confidence": "high|medium|low|null",
    "matched_fingerprints": ["匹配到的指纹编号列表，如['FP1','FP3']"],
    "reasoning": "为什么判断为/不是灰蝶取食（中文30-60字）",
    "actionable_hint": "给用户的提示（如'请检查叶片附近是否有蚂蚁活动'）"
  }
}

【重要规则】
1. dt_code 必须使用上述 DTM 标准编码，不可自创
2. 如果同时存在多种痕迹类型，选最主要的作为主类型，在 description 中提及其他
3. 灰蝶检测对所有请求都必须执行（即使结果为 negative）
4. 必须填写 confusion_group —— 诚实告知用户这个鉴定是否存在天然混淆风险
5. severity_percent 必须基于实际像素观察给出合理估算，不要总是写10%
`;

    const userPrompt = `请以昆虫学家、古生物学家和植物生态学家的三重身份，仔细分析这张叶片照片上的昆虫取食痕迹。${filename ? `文件名：${filename}` : ''}

【观察步骤 — 请严格按DTM标准逐步推理】

第一步：整体评估
- 图片质量（分辨率、光照、对焦）、叶片完整性
- 叶片形态（单叶/复叶/针形/肉质/有无托叶）

第二步：损伤特征提取（逐维度记录）
- 形状：穿孔/缺口/隧道/斑点/增生/线痕？
- 位置：叶面中部 vs 叶缘 vs 叶脉附近 vs 嫩芽/花蕾？
- 边缘质地：光滑整齐 vs 不规则锯齿 vs 波浪状 vs 有组织反应带？
- 分布模式：集中一处 vs 分散多处 vs 规律排列？
- 特殊迹象：粪便颗粒(frass)？丝网？蜜露？煤污病？蜕皮壳？蚂蚁？

第三步：DTM标准逐一比对
- 对每个DT编码给出匹配度评分(1-5分)
- 记录排除理由和保留理由
- 标注所属混淆组（如有）

第四步：灰蝶专项检测（必须执行！）
- 逐一检查6个灰蝶指纹(FP1-FP6)
- 统计匹配数量和置信度等级
- 即使结果为negative也要输出lycaenid_detection字段

第五步：昆虫区系推断
- 结合痕迹类型 + 叶片形态 + 中国境内常见昆虫区系
- 给出到科/属级的候选列表
- 注意季节性和地域性差异

第六步：损伤量化
- 目测估算受损面积占可见叶面积的百分比
- 判定严重程度等级（轻/中/重）

第七步：综合判断 + 不确定性声明
- 最终DT编码判定 + 置信度 + 混淆组警告 + 局限性

请严格按照JSON格式输出鉴定报告。`;

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
        max_tokens: 6000,
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

// 示例图库信息（DTM金标准版本）
app.get('/api/damage-examples', (req, res) => {
  res.json({
    examples: [
      {
        type: 'marg',
        dt_code: 'DT1',
        cn: '边缘取食 (Margin Feeding)',
        icon: '📐',
        ffg: '外部取食 (External Foliage Feeding)',
        desc: '从叶缘向内取食，形成半圆形、扇形、扇贝形或不规则缺口。最常见的咀嚼式取食模式。缺口边缘通常不规则（咀嚼式口器咬痕）。',
        insects: ['鳞翅目幼虫（多种）', '直翅目若虫', '叶蜂幼虫(Tenthredinidae)'],
        guild: 'chewer',
        confusion_note: '与机械损伤/风害可能混淆——关键看缺口边缘是否不规则'
      },
      {
        type: 'hole',
        dt_code: 'DT2',
        cn: '洞孔取食 (Hole Feeding)',
        icon: '⭕',
        ffg: '外部取食 (External Foliage Feeding)',
        desc: '贯穿叶片全层的圆形/椭圆形/不规则穿孔，位于叶面中部。边缘光滑（叶甲）或锯齿状（鳞翅目幼虫）。',
        insects: ['叶甲(Chrysomelidae)', '象甲(Curculionidae)', '鳞翅目幼虫', '叶蜂幼虫'],
        guild: 'chewer',
        confusion_note: '⚠️ 与DT3骨架化晚期易混淆——需检查残留叶脉走向是否规则'
      },
      {
        type: 'skel',
        dt_code: 'DT3',
        cn: '骨架化 (Skeletonization)',
        icon: '🕸️',
        ffg: '外部取食 (External Foliage Feeding)',
        desc: '选择性取食叶肉组织(mesophyll)，完整保留叶脉网状结构。呈现"窗格状"外观，叶脉间区域变薄呈半透明。',
        insects: ['叶蜂幼虫(Sawflies)', '叶甲幼虫', '象甲幼虫'],
        guild: 'chewer',
        confusion_note: '⚠️ 晚期细脉断裂后类似DT2洞孔——这是天然混淆组A'
      },
      {
        type: 'mine',
        dt_code: 'DT41-49',
        cn: '潜叶隧道 (Leaf Mining)',
        icon: '〰️',
        ffg: '潜叶取食 (Internal Mining)',
        desc: '在上下表皮之间形成的蜿蜒/斑块状隧道。蛇形(DT41)有粪便线(frass trail)；斑块式(DT42)无轨迹；帐篷状(DT45)呈隆起结构。',
        insects: ['潜叶蛾(Gracillariidae/Lyonetiidae)', '潜叶蝇(Agromyzidae)', '潜叶蜂(Tenthredinidae)'],
        guild: 'miner',
        confusion_note: '⚠️ DT42斑块潜叶 vs DT51虫瘿易混淆——切开看内部是否有粪/空腔'
      },
      {
        type: 'gall',
        dt_code: 'DT51-55',
        cn: '虫瘿 (Galling)',
        icon: '🔵',
        ffg: '造瘿 (Galling)',
        desc: '昆虫刺激植物组织异常增生的球形/椭圆形肿块。是植物的反应性生长（非直接啃食！），触感比周围叶片更厚实。',
        insects: ['瘿蚊(Cecidomyiidae)', '瘿蜂(Cynipidae)', '瘿蚜(Aphididae部分)'],
        guild: 'sucker',
        confusion_note: '注意：虫瘿背面也可能有(DT52)，需要翻看叶片两面'
      },
      {
        type: 'spot',
        dt_code: 'DT61-67',
        cn: '刺吸损伤 (Piercing/Sucking)',
        icon: '🔘',
        ffg: '刺吸 (Piercing & Sucking)',
        desc: '大量密集的小型失绿斑点(0.1-0.5mm)，不穿透叶片。可能伴蜜露分泌→煤污病。极难与真菌病害区分！',
        insects: ['蚜虫(Aphidoidea)', '叶螨(Tetranychidae)', '蝉若虫', '粉虱(Aleyrodidae)'],
        guild: 'sucker',
        confusion_note: '⚠️⚠️ 极高难度混淆组C：与真菌病害+营养缺乏几乎无法纯视觉区分'
      },
      {
        type: 'surf',
        dt_code: 'DT4',
        cn: '表面刮擦 (Surface Feeding)',
        icon: '📏',
        ffg: '外部取食 (External Foliage Feeding)',
        desc: '仅刮除上表皮或部分叶肉，不穿透下表皮，形成半透明"窗口"斑。与DT3区别：不系统性避开叶脉。',
        insects: ['蓟马(Thysanoptera)', '蛞蝓(Slug)', '蜗牛', '某些叶甲'],
        guild: 'chewer',
        confusion_note: ''
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
