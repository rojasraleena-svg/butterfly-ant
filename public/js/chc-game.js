/**
 * CHC 化学配对游戏模块
 * 可测试的纯逻辑 + DOM 渲染分离
 */

const CHC_SLOTS = [
  { id: 'alc', label: '红蚁 Myrmica', answer: 'alc' },
  { id: 'las', label: '黑蚁 Lasius', answer: 'las' },
  { id: 'cam', label: '弓背蚁 Camponotus', answer: 'cam' }
];

const CHC_OPTIONS = [
  { type: 'alc', text: 'C21-C33 烷烃 + 高比例甲基烷烃' },
  { type: 'las', text: 'C23-C35 n-烷烃为主 + 少量烯烃' },
  { type: 'cam', text: '支链烷烃 + 环丙基化合物丰富' },
  { type: 'wrong', text: '短链脂肪酸 + 酯类混合物' }
];

// ===== 状态机（可独立测试） =====
let chcState = null;

function createCHCState() {
  return {
    slots: CHC_SLOTS.map(s => ({ ...s, filled: false, filledType: null, correct: null })),
    options: CHC_OPTIONS.map(o => ({ ...o, used: false, selected: false })),
    selectedOption: null,
    score: 0,
    completed: false
  };
}

function selectOption(state, optionIndex) {
  state.options.forEach(o => (o.selected = false));
  if (state.options[optionIndex].used) return false;
  state.options[optionIndex].selected = true;
  state.selectedOption = optionIndex;
  return true;
}

function fillSlot(state, slotIndex) {
  if (state.selectedOption === null) return { ok: false, reason: 'no_selection' };
  if (state.slots[slotIndex].filled) return { ok: false, reason: 'already_filled' };

  const opt = state.options[state.selectedOption];
  const slot = state.slots[slotIndex];

  slot.filled = true;
  slot.filledType = opt.type;
  opt.used = true;
  opt.selected = false;

  const isCorrect = opt.type === slot.answer;
  slot.correct = isCorrect;
  if (isCorrect) state.score++;

  state.selectedOption = null;

  if (state.slots.every(s => s.filled)) state.completed = true;

  return { ok: true, correct: isCorrect };
}

function resetCHCGame(state) {
  state.slots = CHC_SLOTS.map(s => ({ ...s, filled: false, filledType: null, correct: null }));
  state.options = CHC_OPTIONS.map(o => ({ ...o, used: false, selected: false }));
  state.selectedOption = null;
  state.score = 0;
  state.completed = false;
}

// ===== DOM 渲染 =====
function renderSlots() {
  const container = document.getElementById('chcSlots');
  container.innerHTML = '';
  chcState.slots.forEach((slot, i) => {
    const el = document.createElement('div');
    el.className = 'chc-slot' + (slot.filled ? ' filled' : '') + (slot.correct === true ? ' correct' : '') + (slot.correct === false ? ' wrong' : '');
    el.dataset.answer = slot.answer;
    el.dataset.label = slot.label;
    if (slot.filled) {
      // 找到对应选项的文本
      const optText = CHC_OPTIONS.find(o => o.type === slot.filledType)?.text || '';
      el.innerHTML = optText;
    } else {
      const icon = slot.id === 'alc' ? '🔴' : slot.id === 'las' ? '⚫' : '🟤';
      el.innerHTML = `${icon} ${slot.label}`;
    }
    el.addEventListener('click', () => handleSlotClick(i));
    container.appendChild(el);
  });
}

function renderOptions() {
  const container = document.getElementById('chcOptions');
  container.innerHTML = '';
  chcState.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'chc-opt' + (opt.used ? ' used' : '') + (opt.selected ? ' selected' : '');
    btn.dataset.type = opt.type;
    btn.textContent = opt.text;
    btn.onclick = () => handleSelectOption(i);
    container.appendChild(btn);
  });
}

function updateResult(msg) {
  document.getElementById('chcResult').innerHTML = msg;
}

function handleSelectOption(optionIndex) {
  const result = selectOption(chcState, optionIndex);
  if (!result) return;
  renderOptions();
  updateResult('现在点击上方一个空槽位放入这个化合物 →');
}

function handleSlotClick(slotIndex) {
  if (chcState.selectedOption === null) {
    updateResult('<span style="color:var(--accent-gold)">⚠️ 请先选择一个化合物卡片！</span>');
    return;
  }

  const result = fillSlot(chcState, slotIndex);

  if (!result.ok) {
    if (result.reason === 'already_filled') return; // 静默忽略
    return;
  }

  renderOptions();
  renderSlots();

  if (result.correct) {
    const slot = chcState.slots[slotIndex];
    updateResult(`<span style="color:var(--accent-green)">✅ 正确！${slot.label}需要这种CHC特征。</span>`);
  } else {
    const slot = chcState.slots[slotIndex];
    updateResult(`<span style="color:var(--accent-red)">❌ 不对哦。${slot.label}不使用这种化合物组合。</span>`);
  }

  if (chcState.completed) {
    setTimeout(() => {
      const msg = chcState.score >= 2
        ? `🎉 太棒了！匹配对了 ${chcState.score}/3 个！<br><br><button class="btn btn-primary" onclick="handleCHCReset()">🔄 再来一次</button>`
        : `😅 匹对了 ${chcState.score}/3 个。<br><br><button class="btn btn-outline" onclick="handleCHCReset()">🔄 再来一次</button>`;
      updateResult(msg);
    }, 500);
  }
}

function handleCHCReset() {
  resetCHCGame(chcState);
  renderOptions();
  renderSlots();
  updateResult('选择一个化合物卡片开始配对 ↑');
}

// ===== 初始化 =====
function initCHCGame() {
  chcState = createCHCState();
  renderOptions();
  renderSlots();
}

// 导出供测试使用
if (typeof module !== 'undefined') {
  module.exports = { CHC_SLOTS, CHC_OPTIONS, createCHCState, selectOption, fillSlot, resetCHCGame };
}
