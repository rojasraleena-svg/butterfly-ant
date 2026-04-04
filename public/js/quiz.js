/**
 * Quiz 测验模块
 * 可测试的纯逻辑 + DOM 渲染分离
 */

const QUIZ_DATA = [
  { q:'大蓝蝶（Maculinea arion）的幼虫在蚁巢内主要吃什么？', options:['寄主植物的叶子','蚂蚁搬运回来的食物','蚂蚁的幼虫和蛹','储存的蜜露'], answer:2, feedback:'没错！大蓝蝶是"社会性寄生虫"，在蚁巢内捕食蚂蚁的后代。一只毛毛虫可以吃掉数百只蚂蚁幼虫。' },
  { q:'蝴蝶幼虫用来吸引蚂蚁的蜜露是从哪个器官分泌的？', options:['口器','腹部背面的DNO（背部蜜腺）','足部腺体','触角'], answer:1, feedback:'正确！DNO（Dorsal Nectary Organ）位于第7腹节背面，分泌含糖量高达30%的蜜露。' },
  { q:'蝴蝶幼虫如何"模仿"蚂蚁的通讯方式？', options:['释放相似的挥发性物质','用身体敲击产生振动信号','发出超声波','发光'], answer:0, feedback:'主要是前两种！化学拟态（CHC）+ 振动通讯是两大核心机制。' },
  { q:'以下哪种关系描述了Maculinea arion与蚂蚁的典型互动？', options:['纯粹的互利共生','兼性共生（可选）','从互利转向社会性寄生','完全的捕食者-猎物'], answer:2, feedback:'正是如此！前期互利共生，后期转变为社会性寄生，是最复杂的两阶段策略。' },
  { q:'英国的大蓝蝶重引入项目成功的核心原因是什么？', options:['人工饲养大量释放','恢复整个生态系统（包括蚂蚁种群）','使用农药消灭竞争者','温室保护越冬'], answer:1, feedback:'正确！大蓝蝶的保护必须同时保护宿主植物和宿主蚂蚁——"全生态系统保护"的经典案例。' }
];

// ===== 状态机（可独立测试） =====
let quizState = null;

function createQuizState(data) {
  return { data: data, currentIndex: 0, score: 0, answers: [], completed: false };
}

function getCurrentQuestion(state) { return state.data[state.currentIndex]; }

function selectAnswer(state, optionIndex) {
  const q = getCurrentQuestion(state);
  const isCorrect = optionIndex === q.answer;
  if (isCorrect) state.score++;
  state.answers.push({ questionIndex: state.currentIndex, selected: optionIndex, correct: isCorrect });
  return isCorrect;
}

function goToNext(state) {
  if (state.currentIndex < state.data.length - 1) { state.currentIndex++; return true; }
  state.completed = true;
  return false;
}

function goToPrev(state) {
  if (state.currentIndex > 0) { state.currentIndex--; return true; }
  return false;
}

function resetQuiz(state) {
  state.currentIndex = 0; state.score = 0; state.answers = []; state.completed = false;
}

function getScoreMessage(state) {
  const r = state.score / state.data.length;
  if (r >= 0.8) return '太厉害了！你是蚁蝶互作专家！🦋';
  if (r >= 0.6) return '不错！已经掌握了核心知识！💪';
  if (r >= 0.4) return '继续加油！多看看上面的内容哦~ 📖';
  return '建议从头再看一遍各个模块！🔄';
}

// ===== DOM 渲染 =====
function renderQuiz() {
  const q = getCurrentQuestion(quizState);
  document.getElementById('quizQ').textContent = `Q${quizState.currentIndex+1}/${QUIZ_DATA.length}: ${q.q}`;

  const optsEl = document.getElementById('quizOpts');
  optsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(i, btn);
    optsEl.appendChild(btn);
  });

  document.getElementById('quizFeedback').innerHTML = '';

  // 进度点
  const progEl = document.getElementById('quizProgress');
  progEl.innerHTML = '';
  for (let i = 0; i < QUIZ_DATA.length; i++) {
    const d = document.createElement('div');
    d.className = 'qp-dot' + (i === quizState.currentIndex ? ' current' : (i < quizState.currentIndex ? ' done' : ''));
    progEl.appendChild(d);
  }

  // 导航按钮
  const navEl = document.getElementById('quizNav');
  navEl.innerHTML = '';
  if (quizState.currentIndex > 0) {
    const b = document.createElement('button');
    b.className = 'btn btn-outline';
    b.textContent = '← 上一题';
    b.onclick = () => { goToPrev(quizState); renderQuiz(); };
    navEl.appendChild(b);
  }
  if (!quizState.completed && quizState.currentIndex < QUIZ_DATA.length - 1) {
    const b = document.createElement('button');
    b.className = 'btn btn-outline';
    b.textContent = '下一题 →';
    b.style.display = 'none';
    b.id = 'nextBtn';
    b.onclick = () => { goToNext(quizState); renderQuiz(); };
    navEl.appendChild(b);
  }
  // 完成后显示重新开始按钮
  if (quizState.completed) {
    const b = document.createElement('button');
    b.className = 'btn btn-primary';
    b.textContent = '🔄 重新开始';
    b.onclick = handleReset;
    navEl.appendChild(b);
  }
}

function handleAnswer(idx, btn) {
  const q = getCurrentQuestion(quizState);
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach(o => { o.style.pointerEvents = 'none'; });

  const isCorrect = selectAnswer(quizState, idx);
  if (isCorrect) {
    btn.classList.add('correct');
    document.getElementById('quizFeedback').innerHTML = `<span style="color:var(--accent-green)">✅ ${q.feedback}</span>`;
  } else {
    btn.classList.add('wrong');
    opts[q.answer].classList.add('correct');
    document.getElementById('quizFeedback').innerHTML =
      `<span style="color:var(--accent-red)">❌ 正确答案是：${q.options[q.answer]}<br><span style="color:var(--accent-green)">${q.feedback}</span></span>`;
  }

  const nb = document.getElementById('nextBtn');
  if (nb) nb.style.display = 'inline-block';
  else if (quizState.currentIndex === QUIZ_DATA.length - 1) {
    setTimeout(() => {
      document.getElementById('quizFeedback').innerHTML +=
        `<br><br><strong style="font-size:1.1em">🏆 最终得分：${quizState.score}/${QUIZ_DATA.length}</strong><br>${getScoreMessage(quizState)}`;
      renderQuiz(); // 重新渲染以显示"重新开始"按钮
    }, 500);
  }
}

function handleReset() {
  resetQuiz(quizState);
  renderQuiz();
}

// ===== 初始化 =====
function initQuiz() {
  quizState = createQuizState(QUIZ_DATA);
  renderQuiz();
}

// 导出供测试使用
if (typeof module !== 'undefined') {
  module.exports = { QUIZ_DATA, createQuizState, getCurrentQuestion, selectAnswer, goToNext, goToPrev, resetQuiz, getScoreMessage };
}
