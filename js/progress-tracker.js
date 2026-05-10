/**
 * Progress Tracker — Agent 学习平台
 * 学习进度追踪与管理
 */
(function(AL) {
  'use strict';

  const PROGRESS_KEY = 'progress';
  const TOTAL_CHAPTERS = 16;

  function init() {
    updateUI();
  }

  function getProgress() {
    return AL.Store.get(PROGRESS_KEY, {
      completedQuizzes: {},
      completedChapters: {},
      lastVisit: null,
      streak: 0
    });
  }

  function markQuizComplete(chapterNum) {
    const p = getProgress();
    p.completedQuizzes[chapterNum] = Date.now();
    p.lastVisit = Date.now();
    AL.Store.set(PROGRESS_KEY, p);
    updateUI();
    AL.toast(`第${chapterNum}章测验已完成！`, 'success');
  }

  function markChapterRead(chapterNum) {
    const p = getProgress();
    p.completedChapters[chapterNum] = Date.now();
    p.lastVisit = Date.now();
    AL.Store.set(PROGRESS_KEY, p);
    updateUI();
  }

  function getCompletionPercent() {
    const p = getProgress();
    const quizDone = Object.keys(p.completedQuizzes).length;
    return Math.round((quizDone / TOTAL_CHAPTERS) * 100);
  }

  function getChapterStatus(chapterNum) {
    const p = getProgress();
    return {
      quizDone: !!p.completedQuizzes[chapterNum],
      readDone: !!p.completedChapters[chapterNum],
      quizTime: p.completedQuizzes[chapterNum] || null
    };
  }

  function updateUI() {
    const pct = getCompletionPercent();
    const pctEl = AL.$('#progressPercent');
    const fillEl = AL.$('#progressFill');
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';

    // Update nav links
    AL.$$('.nav-link').forEach(link => {
      const ch = link.dataset.chapter;
      if (ch && getProgress().completedQuizzes[ch]) {
        link.classList.add('completed');
      }
    });
  }

  function resetAll() {
    AL.Store.remove(PROGRESS_KEY);
    updateUI();
    AL.toast('学习进度已重置', 'info');
  }

  // Public API
  AL.Progress = {
    init,
    getProgress,
    markQuizComplete,
    markChapterRead,
    getCompletionPercent,
    getChapterStatus,
    updateUI,
    resetAll,
    TOTAL_CHAPTERS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
