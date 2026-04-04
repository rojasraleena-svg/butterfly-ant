import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Quiz 测试数据（与 quiz.html 一致）
const QUIZ_DATA = [
  { q:'大蓝蝶（Maculinea arion）的幼虫在蚁巢内主要吃什么？', options:['寄主植物的叶子','蚂蚁搬运回来的食物','蚂蚁的幼虫和蛹','储存的蜜露'], answer:2, feedback:'没错！大蓝蝶是"社会性寄生虫"。' },
  { q:'蝴蝶幼虫用来吸引蚂蚁的蜜露是从哪个器官分泌的？', options:['口器','腹部背面的DNO（背部蜜腺）','足部腺体','触角'], answer:1, feedback:'正确！DNO位于第7腹节背面。' },
  { q:'以下哪种关系描述了Maculinea arion与蚂蚁的典型互动？', options:['纯粹的互利共生','兼性共生（可选）','从互利转向社会性寄生','完全的捕食者-猎物'], answer:2, feedback:'正是如此！两阶段策略。' },
  { q:'英国的大蓝蝶重引入项目成功的核心原因是什么？', options:['人工饲养大量释放','恢复整个生态系统','使用农药消灭竞争者','温室保护越冬'], answer:1, feedback:'正确！全生态系统保护。' },
  { q:'蝴蝶如何"模仿"蚂蚁的通讯方式？', options:['释放相似的挥发性物质','用身体敲击产生振动信号','发出超声波','发光'], answer:0, feedback:'化学拟态+振动通讯是两大机制。' }
];

/**
 * 创建 Quiz 状态机（纯逻辑，不依赖 DOM）
 */
function createQuizState(data) {
  return {
    data: data,
    currentIndex: 0,
    score: 0,
    answers: [], // 记录每题的选择
    completed: false
  };
}

function getCurrentQuestion(state) {
  return state.data[state.currentIndex];
}

function selectAnswer(state, optionIndex) {
  const q = getCurrentQuestion(state);
  const isCorrect = optionIndex === q.answer;
  if (isCorrect) state.score++;
  state.answers.push({ questionIndex: state.currentIndex, selected: optionIndex, correct: isCorrect });
  return isCorrect;
}

function goToNext(state) {
  if (state.currentIndex < state.data.length - 1) {
    state.currentIndex++;
    return true;
  }
  state.completed = true;
  return false;
}

function goToPrev(state) {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    return true;
  }
  return false;
}

function resetQuiz(state) {
  state.currentIndex = 0;
  state.score = 0;
  state.answers = [];
  state.completed = false;
}

function getScoreMessage(state) {
  const ratio = state.score / state.data.length;
  if (ratio >= 0.8) return '太厉害了！你是蚁蝶互作专家！';
  if (ratio >= 0.6) return '不错！已经掌握了核心知识！';
  if (ratio >= 0.4) return '继续加油！多看看上面的内容哦~';
  return '建议从头再看一遍各个模块！';
}

describe('Quiz 逻辑模块', () => {
  let state;

  beforeEach(() => {
    state = createQuizState(QUIZ_DATA);
  });

  describe('createQuizState', () => {
    it('应初始化为第0题，分数0，未完成', () => {
      expect(state.currentIndex).toBe(0);
      expect(state.score).toBe(0);
      expect(state.completed).toBe(false);
    });

    it('应保留完整的题目数据', () => {
      expect(state.data.length).toBe(5);
      expect(state.data[0].q).toContain('大蓝蝶');
    });
  });

  describe('getCurrentQuestion', () => {
    it('初始应返回第1题', () => {
      const q = getCurrentQuestion(state);
      expect(q.q).toContain('大蓝蝶');
      expect(q.options.length).toBe(4);
    });
  });

  describe('selectAnswer', () => {
    it('选择正确答案应加分', () => {
      const q = getCurrentQuestion(state);
      const result = selectAnswer(state, q.answer);
      expect(result).toBe(true);
      expect(state.score).toBe(1);
    });

    it('选择错误答案不应加分', () => {
      const q = getCurrentQuestion(state);
      const wrongIdx = q.answer === 0 ? 1 : 0;
      const result = selectAnswer(state, wrongIdx);
      expect(result).toBe(false);
      expect(state.score).toBe(0);
    });

    it('应记录答案到 answers 数组', () => {
      selectAnswer(state, 2);
      expect(state.answers.length).toBe(1);
      expect(state.answers[0].selected).toBe(2);
    });
  });

  describe('goToNext / goToPrev', () => {
    it('前进到下一题应更新 currentIndex', () => {
      const canAdvance = goToNext(state);
      expect(canAdvance).toBe(true);
      expect(state.currentIndex).toBe(1);
    });

    it('最后一题再前进应标记完成', () => {
      state.currentIndex = 4; // 最后一题（index 4）
      const canAdvance = goToNext(state);
      expect(canAdvance).toBe(false);
      expect(state.completed).toBe(true);
    });

    it('从第1题不能后退', () => {
      const canGoBack = goToPrev(state);
      expect(canGoBack).toBe(false);
      expect(state.currentIndex).toBe(0);
    });

    it('从第2题可以后退', () => {
      state.currentIndex = 2;
      const canGoBack = goToPrev(state);
      expect(canGoBack).toBe(true);
      expect(state.currentIndex).toBe(1);
    });
  });

  describe('resetQuiz', () => {
    it('应将状态完全重置为初始值', () => {
      // 先玩几题
      selectAnswer(state, getCurrentQuestion(state).answer);
      goToNext(state);
      selectAnswer(state, getCurrentQuestion(state).answer);
      state.currentIndex = 3;
      state.score = 2;

      // 重置
      resetQuiz(state);

      expect(state.currentIndex).toBe(0);
      expect(state.score).toBe(0);
      expect(state.answers).toEqual([]);
      expect(state.completed).toBe(false);
    });
  });

  describe('getScoreMessage', () => {
    it('>=80% 应返回专家评价', () => {
      state.score = 4; // 4/5 = 80%
      expect(getScoreMessage(state)).toContain('专家');
    });

    it('>=60% 应返回不错评价', () => {
      state.score = 3; // 3/5 = 60%
      expect(getScoreMessage(state)).toContain('不错');
    });

    it('<40% 应返回建议重看', () => {
      state.score = 1; // 1/5 = 20%
      expect(getScoreMessage(state)).toContain('再看一遍');
    });
  });
});
