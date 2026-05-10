/**
 * Learning Path — Agent 学习平台
 * 学习路径向导：章节状态追踪、推荐引擎、进度可视化
 */
(function(AL) {
  'use strict';

  const STORAGE_KEY = 'learning_path';
  const TOTAL_CHAPTERS = 12;

  // 状态常量
  const STATUS = {
    NOT_STARTED: 'not-started',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    MASTERED: 'mastered'
  };

  // 每个章节预估学习时长（分钟）
  const ESTIMATED_MINUTES_PER_CHAPTER = 30;

  // ============ 内部数据管理 ============
  let data = null;

  function loadData() {
    if (data) return data;
    const stored = AL.Store.get(STORAGE_KEY, null);
    if (stored) {
      data = stored;
      // 确保所有章节都有条目（兼容旧数据）
      ensureAllChapters();
    } else {
      data = initFreshData();
    }
    return data;
  }

  function initFreshData() {
    const d = {
      chapters: {},
      studyDates: [],
      lastActiveDate: null
    };
    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      d.chapters[i] = {
        visited: false,
        visitedAt: null,
        status: STATUS.NOT_STARTED
      };
    }
    return d;
  }

  function ensureAllChapters() {
    if (!data.chapters) data.chapters = {};
    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      if (!data.chapters[i]) {
        data.chapters[i] = {
          visited: false,
          visitedAt: null,
          status: STATUS.NOT_STARTED
        };
      }
    }
    if (!data.studyDates) data.studyDates = [];
    if (!data.lastActiveDate) data.lastActiveDate = null;
  }

  function saveData() {
    AL.Store.set(STORAGE_KEY, data);
  }

  // ============ 记录学习日期 ============
  function recordStudyDate() {
    const today = getDateString();
    if (!data.studyDates.includes(today)) {
      data.studyDates.push(today);
      data.studyDates.sort();
    }
    data.lastActiveDate = today;
    saveData();
  }

  function getDateString(date) {
    const d = date || new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ============ 提取进度数据中的测验分数 ============
  function getQuizScore(chapterNum) {
    // 尝试从成就模块获取分数
    if (AL.Achievements) {
      const all = AL.Achievements.getAll();
      // 这里无法直接获取quizScores，改用progress判断
    }
    // 通过 Progress 模块判断是否完成测验
    if (AL.Progress) {
      const p = AL.Progress.getProgress();
      if (p.completedQuizzes && p.completedQuizzes[chapterNum]) {
        return 100; // 当前系统中只有100%才标记为完成
      }
    }
    return null;
  }

  // ============ 计算章节状态 ============
  function computeStatus(chapterNum) {
    const num = parseInt(chapterNum);
    const ch = (data.chapters && data.chapters[num]) ? data.chapters[num] : null;
    const visited = ch ? ch.visited : false;
    const quizScore = getQuizScore(num);

    if (quizScore === 100) {
      return STATUS.MASTERED;
    } else if (quizScore !== null && quizScore < 100) {
      return STATUS.COMPLETED;
    } else if (visited) {
      return STATUS.IN_PROGRESS;
    } else {
      return STATUS.NOT_STARTED;
    }
  }

  // ============ 同步状态 ============
  function syncAllStatuses() {
    ensureAllChapters();
    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      const status = computeStatus(i);
      if (data.chapters[i]) {
        data.chapters[i].status = status;
      }
    }
    saveData();
  }

  // ============ CSS 注入 ============
  let cssInjected = false;

  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* 学习路径容器 */
      .learning-path-container {
        padding: 20px 0;
      }
      .learning-path-container .lp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .learning-path-container .lp-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      .learning-path-container .lp-stats {
        font-size: 0.82rem;
        color: var(--text-muted);
      }
      .learning-path-container .lp-stats span {
        color: var(--accent-cyan);
        font-weight: 600;
      }

      /* 进度条 */
      .lp-track {
        display: flex;
        align-items: center;
        gap: 0;
        padding: 16px 0;
        flex-wrap: wrap;
        justify-content: center;
      }

      /* 章节圆点 */
      .lp-dot {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--ease-base);
        position: relative;
        border: 2px solid transparent;
        background: var(--bg-tertiary);
        color: var(--text-muted);
        flex-shrink: 0;
      }
      .lp-dot:hover {
        transform: scale(1.15);
        z-index: 2;
      }
      .lp-dot .lp-tooltip {
        display: none;
        position: absolute;
        bottom: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 6px 12px;
        font-size: 0.72rem;
        font-weight: 400;
        white-space: nowrap;
        box-shadow: var(--shadow-md);
        pointer-events: none;
        z-index: 10;
      }
      .lp-dot:hover .lp-tooltip {
        display: block;
      }

      /* 连接线 */
      .lp-connector {
        width: 28px;
        height: 3px;
        flex-shrink: 0;
        border-radius: 2px;
        background: var(--border-color);
        transition: background var(--ease-base);
      }

      /* 状态颜色 */
      .lp-dot.not-started {
        background: var(--bg-tertiary);
        color: var(--text-muted);
        border-color: var(--border-color);
      }
      .lp-dot.in-progress {
        background: rgba(68, 138, 255, 0.15);
        color: var(--accent-blue);
        border-color: var(--accent-blue);
        box-shadow: 0 0 12px rgba(68, 138, 255, 0.2);
      }
      .lp-dot.completed {
        background: rgba(255, 145, 0, 0.15);
        color: var(--accent-orange);
        border-color: var(--accent-orange);
        box-shadow: 0 0 12px rgba(255, 145, 0, 0.2);
      }
      .lp-dot.mastered {
        background: rgba(0, 230, 118, 0.15);
        color: var(--accent-green);
        border-color: var(--accent-green);
        box-shadow: 0 0 16px rgba(0, 230, 118, 0.3);
      }

      /* 已完成状态的颜色也传递到连接线 */
      .lp-connector.done {
        background: var(--accent-green);
        opacity: 0.5;
      }

      /* 状态图例 */
      .lp-legend {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 8px;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .lp-legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .lp-legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .lp-legend-dot.lg-not-started { background: var(--bg-tertiary); border: 1px solid var(--border-color); }
      .lp-legend-dot.lg-in-progress { background: var(--accent-blue); }
      .lp-legend-dot.lg-completed   { background: var(--accent-orange); }
      .lp-legend-dot.lg-mastered    { background: var(--accent-green); }

      /* 推荐卡片 */
      .lp-recommendation {
        text-align: center;
        margin-top: 16px;
        padding: 16px 20px;
        background: linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(180,74,238,0.04) 100%);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.9rem;
      }
      .lp-recommendation .lp-rec-label {
        font-size: 0.72rem;
        color: var(--accent-cyan);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .lp-recommendation .lp-rec-chapter {
        font-weight: 700;
        color: var(--text-primary);
        font-size: 1rem;
      }
      .lp-recommendation .lp-rec-desc {
        color: var(--text-secondary);
        font-size: 0.82rem;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  // ============ 公开 API：获取章节状态 ============
  function getStatus(chapterNum) {
    loadData();
    syncAllStatuses();
    const num = parseInt(chapterNum);
    if (num < 1 || num > TOTAL_CHAPTERS) return STATUS.NOT_STARTED;
    return data.chapters[num] ? data.chapters[num].status : STATUS.NOT_STARTED;
  }

  // ============ 公开 API：标记已访问 ============
  function markVisited(chapterNum) {
    loadData();
    const num = parseInt(chapterNum);
    if (num < 1 || num > TOTAL_CHAPTERS) return;

    if (!data.chapters[num]) {
      data.chapters[num] = { visited: false, visitedAt: null, status: STATUS.NOT_STARTED };
    }

    data.chapters[num].visited = true;
    data.chapters[num].visitedAt = Date.now();

    // 如果当前状态是 not-started，提升到 in-progress
    if (data.chapters[num].status === STATUS.NOT_STARTED) {
      data.chapters[num].status = STATUS.IN_PROGRESS;
    }

    recordStudyDate();
    syncAllStatuses();
  }

  // ============ 公开 API：推荐下一章 ============
  function getNextRecommendation() {
    loadData();
    syncAllStatuses();

    const chapters = AL.CHAPTERS || [];
    if (!chapters.length) return null;

    // 优先级：not-started > in-progress > completed（非满分）
    const notStarted = [];
    const inProgress = [];
    const completedNotMastered = [];

    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      const status = data.chapters[i] ? data.chapters[i].status : STATUS.NOT_STARTED;
      if (status === STATUS.NOT_STARTED) {
        notStarted.push(i);
      } else if (status === STATUS.IN_PROGRESS) {
        inProgress.push(i);
      } else if (status === STATUS.COMPLETED) {
        completedNotMastered.push(i);
      }
    }

    // 按章节号升序选择
    let targetChapterNum;
    if (notStarted.length > 0) {
      targetChapterNum = notStarted[0];
    } else if (inProgress.length > 0) {
      targetChapterNum = inProgress[0];
    } else if (completedNotMastered.length > 0) {
      targetChapterNum = completedNotMastered[0];
    } else {
      // 所有章节都已完成/掌握，回到第一章
      targetChapterNum = 1;
    }

    const chapter = chapters.find(c => c.num === targetChapterNum);
    return chapter || null;
  }

  // ============ 公开 API：渲染路径 ============
  function renderPath() {
    injectCSS();
    const container = AL.$('#learningPath');
    if (!container) return;

    loadData();
    syncAllStatuses();

    const chapters = AL.CHAPTERS || [];
    const dots = [];
    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      const status = data.chapters[i] ? data.chapters[i].status : STATUS.NOT_STARTED;
      const ch = chapters.find(c => c.num === i) || { num: i, title: '未知章节' };

      const statusLabels = {
        'not-started': '未开始',
        'in-progress': '学习中',
        'completed': '已完成',
        'mastered': '已掌握'
      };

      dots.push(`
        <div class="lp-dot ${status}" data-chapter="${i}" title="第${i}章：${ch.title}">
          ${i}
          <div class="lp-tooltip">第${i}章 · ${statusLabels[status] || status}</div>
        </div>
      `);
    }

    // 构建带连接线的HTML
    let pathHtml = '';
    for (let i = 0; i < dots.length; i++) {
      pathHtml += dots[i];
      if (i < dots.length - 1) {
        const prevStatus = data.chapters[i + 1] ? data.chapters[i + 1].status : STATUS.NOT_STARTED;
        const isDone = (prevStatus === STATUS.MASTERED);
        pathHtml += `<div class="lp-connector${isDone ? ' done' : ''}"></div>`;
      }
    }

    // 计算统计信息
    const stats = computeStats();

    // 获取推荐
    const recommendation = getNextRecommendation();

    container.innerHTML = `
      <div class="learning-path-container">
        <div class="lp-header">
          <span class="lp-title">学习路径</span>
          <span class="lp-stats">
            已完成 <span>${stats.totalCompleted}</span> 章 · 已掌握 <span>${stats.totalMastered}</span> 章 · 预计剩余 <span>${stats.estimatedTimeRemaining}</span>
          </span>
        </div>
        <div class="lp-track">
          ${pathHtml}
        </div>
        <div class="lp-legend">
          <div class="lp-legend-item"><div class="lp-legend-dot lg-not-started"></div> 未开始</div>
          <div class="lp-legend-item"><div class="lp-legend-dot lg-in-progress"></div> 学习中</div>
          <div class="lp-legend-item"><div class="lp-legend-dot lg-completed"></div> 已完成</div>
          <div class="lp-legend-item"><div class="lp-legend-dot lg-mastered"></div> 已掌握</div>
        </div>
        ${recommendation ? `
        <div class="lp-recommendation">
          <div class="lp-rec-label">推荐下一章</div>
          <div class="lp-rec-chapter">第${recommendation.num}章：${recommendation.title}</div>
          <div class="lp-rec-desc">${recommendation.desc || ''}</div>
        </div>` : ''}
      </div>
    `;

    // 绑定圆点点击事件
    container.querySelectorAll('.lp-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const chNum = parseInt(dot.dataset.chapter);
        const ch = AL.CHAPTERS.find(c => c.num === chNum);
        if (ch) {
          const base = AL.PAGE_BASE || '.';
          const chaptersDir = (base === '..') ? 'chapters/' : 'chapters/';
          window.location.href = chaptersDir + ch.file;
        }
      });
    });
  }

  // ============ 公开 API：获取统计 ============
  function computeStats() {
    loadData();
    syncAllStatuses();

    let totalCompleted = 0;
    let totalMastered = 0;

    for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
      const status = data.chapters[i] ? data.chapters[i].status : STATUS.NOT_STARTED;
      if (status === STATUS.COMPLETED || status === STATUS.MASTERED) {
        totalCompleted++;
      }
      if (status === STATUS.MASTERED) {
        totalMastered++;
      }
    }

    // 推算连续学习天数
    let currentStreak = 0;
    const dates = [...(data.studyDates || [])].sort().reverse();
    if (dates.length > 0) {
      const today = new Date();
      const todayStr = getDateString(today);
      const yesterdayStr = getDateString(new Date(today - 86400000));

      // 检查今天或昨天是否有学习记录（连续性起点）
      if (dates[0] === todayStr || dates[0] === yesterdayStr) {
        currentStreak = 1;
        let checkDate = new Date(dates[0] + 'T00:00:00');
        for (let j = 1; j < dates.length; j++) {
          const prevDate = new Date(checkDate - 86400000);
          const prevStr = getDateString(prevDate);
          if (dates[j] === prevStr) {
            currentStreak++;
            checkDate = prevDate;
          } else if (dates[j] === getDateString(checkDate)) {
            // 同一天多条记录，跳过
            continue;
          } else {
            break;
          }
        }
      }
    }

    // 估算剩余时间
    const unfinished = TOTAL_CHAPTERS - totalCompleted;
    const estimatedMinutes = unfinished * ESTIMATED_MINUTES_PER_CHAPTER;
    const estimatedTimeRemaining = estimatedMinutes >= 60
      ? `${Math.ceil(estimatedMinutes / 60)} 小时`
      : `${estimatedMinutes} 分钟`;

    return {
      totalCompleted,
      totalMastered,
      currentStreak,
      estimatedTimeRemaining
    };
  }

  function getStats() {
    return computeStats();
  }

  // ============ 初始化 ============
  function init() {
    injectCSS();
    loadData();
    syncAllStatuses();
    recordStudyDate();

    // 自动标记当前章节为已访问
    if (AL.CURRENT_CHAPTER) {
      markVisited(AL.CURRENT_CHAPTER);
    }

    // 检查是否有进度更新（通过progress模块的数据）
    syncAllStatuses();
  }

  // ============ 公开 API ============
  AL.LearningPath = {
    init,
    getStatus,
    markVisited,
    getNextRecommendation,
    renderPath,
    getStats,
    STATUS
  };

  // ============ 自动初始化 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
