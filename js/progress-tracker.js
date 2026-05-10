/**
 * Progress Tracker — Agent 学习平台
 * 学习进度追踪与管理
 *
 * 存储策略：
 * - 未登录时，数据存储在 al_progress（前缀 al_）
 * - 登录后，数据存储在 al_data_{username}_progress（前缀由 Auth 模块动态设置）
 * - AL.Store._prefix 由 auth.js 在初始化时根据登录状态自动调整
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

  /**
   * 获取所有用户的进度概览（供管理员使用）
   * 直接读取 localStorage，不依赖当前登录状态
   * @returns {Array<{username: string, chaptersRead: number, quizzesDone: number, lastVisit: number|null, notesCount: number}>}
   */
  function getAllUserProgress() {
    var results = [];
    // 遍历 localStorage 中所有 key
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      // 匹配 al_data_*_progress 模式提取用户名
      var match = key && key.match(/^al_data_(.+)_progress$/);
      if (match) {
        var username = match[1];
        try {
          var raw = localStorage.getItem(key);
          var progress = raw ? JSON.parse(raw) : null;
          var chaptersRead = 0;
          var quizzesDone = 0;
          var lastVisit = null;
          if (progress) {
            if (progress.completedChapters) {
              chaptersRead = Object.keys(progress.completedChapters).length;
            }
            if (progress.completedQuizzes) {
              quizzesDone = Object.keys(progress.completedQuizzes).length;
            }
            lastVisit = progress.lastVisit || null;
          }
          // 同时读取该用户的笔记数量
          var notesKey = 'al_data_' + username + '_notes';
          var rawNotes = localStorage.getItem(notesKey);
          var notes = rawNotes ? JSON.parse(rawNotes) : null;
          var notesCount = notes ? (notes.length || 0) : 0;

          results.push({
            username: username,
            chaptersRead: chaptersRead,
            quizzesDone: quizzesDone,
            lastVisit: lastVisit,
            notesCount: notesCount
          });
        } catch (e) {
          // 跳过解析失败的数据
        }
      }
    }
    return results;
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
    getAllUserProgress,
    TOTAL_CHAPTERS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
