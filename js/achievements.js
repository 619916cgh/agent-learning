/**
 * Achievements System — Agent 学习平台
 * 成就/徽章系统：12种成就的检测、颁发、渲染和持久化
 */
(function(AL) {
  'use strict';

  const STORAGE_KEY = 'achievements';
  const TOTAL_CHAPTERS = 12;
  const TOTAL_TOOLS = 5;

  // ============ 成就定义 ============
  const ACHIEVEMENTS = [
    { id: 'first-step',     name: '初识Agent',         desc: '完成任意一章测验',              icon: '🏅' },
    { id: 'half-way',       name: '学途过半',           desc: '完成50%的章节测验',             icon: '🎯' },
    { id: 'full-stack',     name: '全栈Agent工程师',    desc: '完成全部12章测验',              icon: '🏆' },
    { id: 'quiz-master',    name: '满分达人',           desc: '在任意3章测验中获得满分',        icon: '⭐' },
    { id: 'perfect-streak', name: '完美连胜',           desc: '连续3章测验获得满分',            icon: '🔥' },
    { id: 'speedy',         name: '速读高手',           desc: '一天内完成3章学习',             icon: '⚡' },
    { id: 'night-owl',      name: '夜猫子',             desc: '在22:00-06:00之间学习',         icon: '🦉' },
    { id: 'consistency',    name: '持之以恒',           desc: '连续3天学习',                  icon: '📅' },
    { id: 'toolsmith',      name: '工具大师',           desc: '使用全部5个交互工具',            icon: '🛠️' },
    { id: 'note-taker',     name: '笔记达人',           desc: '保存10条以上笔记',              icon: '📝' },
    { id: 'explorer',       name: '探索者',             desc: '访问全部12章',                 icon: '🧭' },
    { id: 'completionist',  name: '完美主义者',         desc: '全部章节测验满分',              icon: '💎' }
  ];

  // ============ 内部数据管理 ============
  let data = null;
  let newlyAwarded = [];

  function loadData() {
    if (data) return data;
    data = AL.Store.get(STORAGE_KEY, {
      earned: {},
      earnedDates: {},
      quizScores: {},
      toolsUsed: [],
      studyDates: []
    });
    return data;
  }

  function saveData() {
    AL.Store.set(STORAGE_KEY, data);
  }

  // ============ CSS 注入 ============
  let cssInjected = false;

  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* 成就网格 */
      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
        padding: 16px 0;
      }

      /* 单个成就徽章 */
      .achievement-badge {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px 18px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        transition: all var(--ease-base);
        position: relative;
        overflow: hidden;
      }
      .achievement-badge:hover {
        border-color: var(--border-glow-cyan);
        box-shadow: var(--shadow-glow-cyan);
        transform: translateY(-2px);
      }

      /* 已获得 */
      .achievement-badge.earned {
        border-color: rgba(0, 229, 255, 0.4);
        background: linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(180,74,238,0.05) 100%);
        box-shadow: 0 0 24px rgba(0, 229, 255, 0.1);
      }
      .achievement-badge.earned .ab-icon {
        filter: grayscale(0);
        opacity: 1;
        text-shadow: 0 0 12px rgba(0, 229, 255, 0.5);
      }
      .achievement-badge.earned .ab-name {
        color: var(--accent-cyan);
      }

      /* 未获得 */
      .achievement-badge.unearned {
        opacity: 0.55;
        filter: grayscale(0.7);
      }
      .achievement-badge.unearned .ab-icon {
        opacity: 0.4;
      }

      /* 徽章图标 */
      .ab-icon {
        font-size: 2rem;
        line-height: 1;
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
        transition: all var(--ease-base);
      }

      /* 徽章文字区域 */
      .ab-info {
        flex: 1;
        min-width: 0;
      }
      .ab-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 2px;
        transition: color var(--ease-base);
      }
      .ab-desc {
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.4;
      }
      .ab-date {
        font-size: 0.7rem;
        color: var(--accent-cyan);
        margin-top: 4px;
        opacity: 0.8;
      }

      /* 刚获得的弹出动画 */
      @keyframes achievement-pop {
        0%   { transform: scale(0); opacity: 0; }
        50%  { transform: scale(1.2); opacity: 1; }
        70%  { transform: scale(1.2); opacity: 1; }
        75%  { box-shadow: 0 0 40px rgba(0, 229, 255, 0.6), 0 0 80px rgba(180, 74, 238, 0.3); }
        100% { transform: scale(1); opacity: 1; box-shadow: 0 0 24px rgba(0, 229, 255, 0.1); }
      }
      .achievement-badge.newly-earned {
        animation: achievement-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      /* 弹出提示 */
      .achievement-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
        border: 2px solid var(--accent-cyan);
        border-radius: var(--radius-lg);
        padding: 16px 28px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 0 40px rgba(0, 229, 255, 0.25), 0 16px 48px rgba(0, 0, 0, 0.4);
        animation: achievement-toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        pointer-events: none;
      }
      @keyframes achievement-toast-in {
        0%   { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.8); }
        100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      }
      .achievement-toast.out {
        animation: achievement-toast-out 0.4s ease forwards;
      }
      @keyframes achievement-toast-out {
        0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.9); }
      }
      .achievement-toast .at-icon {
        font-size: 2.2rem;
      }
      .achievement-toast .at-info {
        text-align: left;
      }
      .achievement-toast .at-title {
        font-size: 0.75rem;
        color: var(--accent-cyan);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .achievement-toast .at-name {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(style);
  }

  // ============ 成就弹出提示 ============
  function showAwardToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="at-icon">${achievement.icon}</div>
      <div class="at-info">
        <div class="at-title">成就解锁!</div>
        <div class="at-name">${achievement.name}</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 450);
    }, 3500);
  }

  // ============ 成就条件检查 ============

  function award(id) {
    const d = loadData();
    if (d.earned[id]) return; // 已获得，跳过
    d.earned[id] = true;
    d.earnedDates[id] = new Date().toISOString();
    newlyAwarded.push(id);

    // 查找成就定义弹出提示
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
      showAwardToast(achievement);
      AL.toast('成就解锁：' + achievement.name + '!', 'success', 3000);
    }
  }

  function getCompletedChapterNums() {
    const progress = AL.Progress ? AL.Progress.getProgress() : {};
    const quizzes = progress.completedQuizzes || {};
    return Object.keys(quizzes).map(Number).sort((a, b) => a - b);
  }

  function getCompletedCount() {
    return getCompletedChapterNums().length;
  }

  function checkFirstStep() {
    if (getCompletedCount() >= 1) award('first-step');
  }

  function checkHalfWay() {
    if (getCompletedCount() >= Math.ceil(TOTAL_CHAPTERS / 2)) award('half-way');
  }

  function checkFullStack() {
    if (getCompletedCount() >= TOTAL_CHAPTERS) award('full-stack');
  }

  function checkQuizMaster() {
    // 在任意3个测验获得满分
    // 当前系统中 completedQuizzes 仅记录满分(100%)的测验
    const d = loadData();
    // 优先使用显式记录的分数
    const scoreEntries = Object.entries(d.quizScores).filter(([, score]) => score === 100);
    const scoreCount = Math.max(scoreEntries.length, getCompletedCount());
    if (scoreCount >= 3) award('quiz-master');
  }

  function checkPerfectStreak() {
    // 连续3章满分
    const completed = getCompletedChapterNums();
    if (completed.length < 3) return;

    // 查找连续的3个章节号
    for (let i = 0; i <= completed.length - 3; i++) {
      if (completed[i + 2] === completed[i] + 2) {
        award('perfect-streak');
        return;
      }
    }
  }

  function checkSpeedy() {
    // 一天内完成3章
    const progress = AL.Progress ? AL.Progress.getProgress() : {};
    const quizzes = progress.completedQuizzes || {};
    const byDate = {};

    Object.entries(quizzes).forEach(([, timestamp]) => {
      const date = new Date(timestamp).toLocaleDateString('zh-CN');
      byDate[date] = (byDate[date] || 0) + 1;
    });

    for (const count of Object.values(byDate)) {
      if (count >= 3) {
        award('speedy');
        return;
      }
    }
  }

  function checkNightOwl() {
    const d = loadData();
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 6;
    if (isNight) {
      d._nightStudy = true;
      saveData();
      award('night-owl');
    }
    // 也检查是否有过夜间学习记录
    if (d._nightStudy) award('night-owl');
  }

  function checkConsistency() {
    // 连续3天学习
    const d = loadData();
    const today = new Date().toLocaleDateString('zh-CN');

    // 记录今天的学习日期
    if (!d.studyDates.includes(today)) {
      d.studyDates.push(today);
      d.studyDates.sort();
      saveData();
    }

    if (d.studyDates.length < 3) return;

    // 检查是否有连续3天的记录
    const sorted = d.studyDates.map(ds => {
      const parts = ds.split('/');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    });

    for (let i = 0; i <= sorted.length - 3; i++) {
      const d1 = sorted[i];
      const d3 = sorted[i + 2];
      const diffDays = Math.round((d3 - d1) / (1000 * 60 * 60 * 24));
      if (diffDays === 2) {
        award('consistency');
        return;
      }
    }
  }

  function checkToolsmith() {
    const d = loadData();
    if (d.toolsUsed.length >= TOTAL_TOOLS) {
      // 去重后检查
      const unique = new Set(d.toolsUsed);
      if (unique.size >= TOTAL_TOOLS) {
        award('toolsmith');
      }
    }
  }

  function checkNoteTaker() {
    const notes = AL.Store.get('notes', []);
    if (notes.length >= 10) award('note-taker');
  }

  function checkExplorer() {
    // 访问全部12章 — 通过学习路径数据或进度数据判断
    // 先检查 learning-path 模块的数据
    const lpData = AL.Store.get('learning_path', null);
    if (lpData && lpData.chapters) {
      const visitedCount = Object.values(lpData.chapters).filter(c => c.visited).length;
      if (visitedCount >= TOTAL_CHAPTERS) {
        award('explorer');
        return;
      }
    }
    // 回退：通过进度数据判断（已完成测验的章 + 已阅读的章）
    const progress = AL.Progress ? AL.Progress.getProgress() : {};
    const readChapters = Object.keys(progress.completedChapters || {}).length;
    const quizChapters = getCompletedCount();
    if (readChapters >= TOTAL_CHAPTERS || quizChapters >= TOTAL_CHAPTERS) {
      award('explorer');
    }
  }

  function checkCompletionist() {
    // 全部12章测验满分
    const d = loadData();
    const scoreCount = Object.entries(d.quizScores).filter(([, score]) => score === 100).length;
    // 同时检查 progress 中的完成数（当前系统只标记100%为完成）
    const completedCount = getCompletedCount();
    const maxFull = Math.max(scoreCount, completedCount);
    if (maxFull >= TOTAL_CHAPTERS) award('completionist');
  }

  // ============ 汇总检查 ============
  function check() {
    newlyAwarded = [];
    loadData();

    // 运行所有成就检查
    checkFirstStep();
    checkHalfWay();
    checkFullStack();
    checkQuizMaster();
    checkPerfectStreak();
    checkSpeedy();
    checkNightOwl();
    checkConsistency();
    checkToolsmith();
    checkNoteTaker();
    checkExplorer();
    checkCompletionist();

    saveData();

    // 如果有新获奖成就，重新渲染
    if (newlyAwarded.length > 0) {
      render();
    }

    return newlyAwarded;
  }

  // ============ 渲染 ============
  function render() {
    injectCSS();
    const container = AL.$('#achievementsGrid');
    if (!container) return;

    const d = loadData();
    const earnedCount = Object.keys(d.earned).length;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 12px 0;">
        <span style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">成就徽章</span>
        <span style="font-size:0.85rem;color:var(--accent-cyan);">${earnedCount} / ${ACHIEVEMENTS.length} 已解锁</span>
      </div>
      <div class="achievements-grid">
        ${ACHIEVEMENTS.map(a => {
          const earned = !!d.earned[a.id];
          const earnedDate = d.earnedDates[a.id];
          const isNew = newlyAwarded.includes(a.id);
          const stateClass = earned ? 'earned' : 'unearned';
          const newClass = isNew ? ' newly-earned' : '';
          const dateHtml = earned && earnedDate
            ? `<div class="ab-date">${AL.formatDate(earnedDate)}</div>`
            : '';

          return `
            <div class="achievement-badge ${stateClass}${newClass}" data-achievement="${a.id}">
              <div class="ab-icon">${a.icon}</div>
              <div class="ab-info">
                <div class="ab-name">${a.name}</div>
                <div class="ab-desc">${a.desc}</div>
                ${dateHtml}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  // ============ 外部接口：记录测验分数 ============
  function recordQuizScore(chapterNum, score) {
    const d = loadData();
    const num = parseInt(chapterNum);
    // 只保留最高分
    const prev = d.quizScores[num] || 0;
    if (score > prev) {
      d.quizScores[num] = score;
      saveData();
    }
    // 记录学习日期
    const today = new Date().toLocaleDateString('zh-CN');
    if (!d.studyDates.includes(today)) {
      d.studyDates.push(today);
      d.studyDates.sort();
      saveData();
    }
    // 重新检查成就
    check();
  }

  // ============ 外部接口：记录工具使用 ============
  function markToolUsed(toolId) {
    const d = loadData();
    if (!d.toolsUsed.includes(toolId)) {
      d.toolsUsed.push(toolId);
      saveData();
    }
    check();
  }

  // ============ 外部接口：记录学习行为 ============
  function markStudySession() {
    const d = loadData();
    const today = new Date().toLocaleDateString('zh-CN');
    if (!d.studyDates.includes(today)) {
      d.studyDates.push(today);
      d.studyDates.sort();
      saveData();
    }
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      d._nightStudy = true;
      saveData();
    }
    check();
  }

  // ============ 获取成就列表数据 ============
  function getAll() {
    const d = loadData();
    return ACHIEVEMENTS.map(a => ({
      id: a.id,
      name: a.name,
      description: a.desc,
      icon: a.icon,
      earned: !!d.earned[a.id],
      earnedDate: d.earnedDates[a.id] || null
    }));
  }

  function getEarnedCount() {
    const d = loadData();
    return Object.keys(d.earned).length;
  }

  // ============ 初始化 ============
  function init() {
    injectCSS();
    loadData();

    // 记录学习日期
    const today = new Date().toLocaleDateString('zh-CN');
    const d = loadData();
    if (!d.studyDates.includes(today)) {
      d.studyDates.push(today);
      d.studyDates.sort();
      saveData();
    }

    // 检查夜间学习
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      d._nightStudy = true;
      saveData();
    }

    // 运行成就检查
    check();
  }

  // ============ 公开 API ============
  AL.Achievements = {
    init,
    check,
    render,
    recordQuizScore,
    markToolUsed,
    markStudySession,
    getAll,
    getEarnedCount,
    ACHIEVEMENTS
  };

  // ============ 自动初始化 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
