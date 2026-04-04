import { describe, it, expect, beforeEach } from 'vitest';

// CHC 游戏数据（与 chemical.html 一致）
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

/**
 * 创建 CHC 游戏状态机（纯逻辑）
 */
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
  // 取消之前的选择
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

  // 检查是否全部填满
  if (state.slots.every(s => s.filled)) {
    state.completed = true;
  }

  return { ok: true, correct: isCorrect };
}

function resetCHCGame(state) {
  state.slots = CHC_SLOTS.map(s => ({ ...s, filled: false, filledType: null, correct: null }));
  state.options = CHC_OPTIONS.map(o => ({ ...o, used: false, selected: false }));
  state.selectedOption = null;
  state.score = 0;
  state.completed = false;
}

describe('CHC 化学配对游戏逻辑', () => {
  let state;

  beforeEach(() => {
    state = createCHCState();
  });

  describe('createCHCState', () => {
    it('应初始化3个空槽位和4个可用选项', () => {
      expect(state.slots.length).toBe(3);
      expect(state.options.length).toBe(4);
      expect(state.slots.every(s => !s.filled)).toBe(true);
      expect(state.options.every(o => !o.used)).toBe(true);
      expect(state.score).toBe(0);
      expect(state.completed).toBe(false);
    });
  });

  describe('selectOption', () => {
    it('应标记选项为选中状态', () => {
      selectOption(state, 0);
      expect(state.options[0].selected).toBe(true);
      expect(state.selectedOption).toBe(0);
    });

    it('选择新选项应取消旧选项的选中状态', () => {
      selectOption(state, 0);
      selectOption(state, 2);
      expect(state.options[0].selected).toBe(false);
      expect(state.options[2].selected).toBe(true);
      expect(state.selectedOption).toBe(2);
    });

    it('已使用的选项不能被选中', () => {
      state.options[0].used = true;
      const result = selectOption(state, 0);
      expect(result).toBe(false);
    });
  });

  describe('fillSlot', () => {
    it('未选择选项时填充槽位应失败', () => {
      const result = fillSlot(state, 0);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('no_selection');
    });

    it('已填充的槽位不能再填充', () => {
      selectOption(state, 0);
      fillSlot(state, 0); // 填充第0槽
      selectOption(state, 1);
      const result = fillSlot(state, 0); // 尝试再填第0槽
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('already_filled');
    });

    it('正确匹配应加分并标记正确', () => {
      // alc 选项 → alc 槽位（红蚁 Myrmica，索引0）
      selectOption(state, 0); // alc 类型选项
      const result = fillSlot(state, 0); // alc 槽位
      expect(result.ok).toBe(true);
      expect(result.correct).toBe(true);
      expect(state.score).toBe(1);
      expect(state.slots[0].correct).toBe(true);
    });

    it('错误匹配不应加分并标记错误', () => {
      // wrong 选项 → alc 槽位
      selectOption(state, 3); // wrong 类型选项
      const result = fillSlot(state, 0); // alc 槽位
      expect(result.ok).toBe(true);
      expect(result.correct).toBe(false);
      expect(state.score).toBe(0);
      expect(state.slots[0].correct).toBe(false);
    });

    it('使用过的选项不能再选', () => {
      selectOption(state, 0);
      fillSlot(state, 0);
      expect(state.options[0].used).toBe(true);
      expect(state.options[0].selected).toBe(false);
    });

    it('3个槽位全填满后应标记完成', () => {
      // 正确配对：alc→0, las→1, cam→2
      selectOption(state, 0); fillSlot(state, 0); // alc → slot 0 ✓
      selectOption(state, 1); fillSlot(state, 1); // las → slot 1 ✓
      selectOption(state, 2); fillSlot(state, 2); // cam → slot 2 ✓
      expect(state.completed).toBe(true);
      expect(state.score).toBe(3);
    });
  });

  describe('resetCHCGame', () => {
    it('应将所有状态重置为初始值', () => {
      // 先玩几步
      selectOption(state, 0);
      fillSlot(state, 0);
      selectOption(state, 3);
      fillSlot(state, 1);

      resetCHCGame(state);

      expect(state.slots.every(s => !s.filled && s.correct === null)).toBe(true);
      expect(state.options.every(o => !o.used && !o.selected)).toBe(true);
      expect(state.selectedOption).toBe(null);
      expect(state.score).toBe(0);
      expect(state.completed).toBe(false);
    });
  });
});
