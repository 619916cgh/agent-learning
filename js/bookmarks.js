/**
 * Bookmarks System — Agent 学习平台
 * 书签/收藏系统：内容卡片收藏、管理和渲染
 */
(function(AL) {
  'use strict';

  const STORAGE_KEY = 'bookmarks';

  // ============ 内部数据管理 ============
  let bookmarks = null;

  function loadBookmarks() {
    if (bookmarks) return bookmarks;
    bookmarks = AL.Store.get(STORAGE_KEY, []);
    return bookmarks;
  }

  function saveBookmarks() {
    AL.Store.set(STORAGE_KEY, bookmarks);
  }

  // ============ 从卡片元素提取信息 ============
  function extractCardInfo(cardElement) {
    if (!cardElement) return null;

    // 提取标题：依次尝试 .card-title, h3, h4, h2
    let cardTitle = '';
    const titleEl = cardElement.querySelector('.card-title')
      || cardElement.querySelector('h3')
      || cardElement.querySelector('h4')
      || cardElement.querySelector('h2');
    if (titleEl) {
      cardTitle = titleEl.textContent.trim();
    }
    if (!cardTitle) {
      // 回退：使用卡片中第一个有意义的文本
      const textEl = cardElement.querySelector('.card-header');
      if (textEl) {
        cardTitle = textEl.textContent.trim().split('\n')[0].substring(0, 80);
      }
    }

    // 提取摘要：前100个可见字符
    const fullText = cardElement.textContent || '';
    const cleaned = fullText.replace(/\s+/g, ' ').trim();
    const cardSnippet = cleaned.length > 100
      ? cleaned.substring(0, 100) + '...'
      : cleaned;

    return { cardTitle, cardSnippet };
  }

  // ============ 获取当前章节信息 ============
  function getCurrentChapterInfo() {
    // 优先使用 AL.CURRENT_CHAPTER
    if (AL.CURRENT_CHAPTER) {
      const ch = (AL.CHAPTERS || []).find(c => c.num === AL.CURRENT_CHAPTER);
      if (ch) {
        return { chapterNum: ch.num, chapterTitle: ch.title };
      }
    }

    // 从 URL 推断章节号
    const path = window.location.pathname;
    const match = path.match(/(\d{2})-[a-z-]+\.html$/i);
    if (match) {
      const num = parseInt(match[1]);
      const ch = (AL.CHAPTERS || []).find(c => c.num === num);
      if (ch) {
        return { chapterNum: ch.num, chapterTitle: ch.title };
      }
    }

    // 从页面标题推断
    const h1 = document.querySelector('h1, .chapter-title');
    const pageTitle = h1 ? h1.textContent.trim() : document.title;

    return { chapterNum: 0, chapterTitle: pageTitle || '未知页面' };
  }

  // ============ CSS 注入 ============
  let cssInjected = false;

  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* 书签按钮 — 放置在卡片右上角 */
      .bookmark-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        color: var(--text-muted);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        z-index: 5;
        opacity: 0;
        transform: scale(0.85);
        transition: all var(--ease-fast);
        padding: 0;
      }
      .content-card:hover .bookmark-btn,
      .card:hover .bookmark-btn {
        opacity: 1;
        transform: scale(1);
      }
      .bookmark-btn:hover {
        border-color: var(--accent-orange);
        color: var(--accent-orange);
        background: rgba(255, 145, 0, 0.1);
        box-shadow: 0 0 12px rgba(255, 145, 0, 0.15);
        transform: scale(1.1);
      }

      /* 已收藏状态 */
      .bookmark-btn.bookmarked {
        opacity: 1;
        border-color: var(--accent-orange);
        color: var(--accent-orange);
        background: rgba(255, 145, 0, 0.12);
        box-shadow: 0 0 10px rgba(255, 145, 0, 0.12);
        transform: scale(1);
      }
      .bookmark-btn.bookmarked:hover {
        border-color: var(--accent-red);
        color: var(--accent-red);
        background: rgba(255, 61, 90, 0.1);
        box-shadow: 0 0 14px rgba(255, 61, 90, 0.15);
        transform: scale(1.1);
      }

      /* 书签添加动画 */
      @keyframes bookmark-pop {
        0%   { transform: scale(0.85); }
        40%  { transform: scale(1.35); }
        100% { transform: scale(1); }
      }
      .bookmark-btn.just-bookmarked {
        animation: bookmark-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      /* 书签列表容器 */
      .bookmark-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .bookmark-list-empty {
        text-align: center;
        color: var(--text-muted);
        padding: 32px 16px;
        font-size: 0.9rem;
      }

      /* 单个书签条目 */
      .bookmark-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        transition: all var(--ease-base);
        cursor: pointer;
        position: relative;
      }
      .bookmark-item:hover {
        border-color: var(--border-glow-cyan);
        box-shadow: var(--shadow-glow-cyan);
      }
      .bookmark-item .bm-star {
        font-size: 1.2rem;
        flex-shrink: 0;
        color: var(--accent-orange);
        margin-top: 2px;
      }
      .bookmark-item .bm-content {
        flex: 1;
        min-width: 0;
      }
      .bookmark-item .bm-chapter {
        font-size: 0.7rem;
        color: var(--accent-cyan);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
      }
      .bookmark-item .bm-title {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .bookmark-item .bm-snippet {
        font-size: 0.78rem;
        color: var(--text-muted);
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .bookmark-item .bm-remove {
        position: absolute;
        top: 8px;
        right: 10px;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.85rem;
        padding: 2px 6px;
        border-radius: var(--radius-xs);
        opacity: 0;
        transition: all var(--ease-fast);
      }
      .bookmark-item:hover .bm-remove {
        opacity: 1;
      }
      .bookmark-item .bm-remove:hover {
        color: var(--accent-red);
        background: rgba(255, 61, 90, 0.1);
      }

      /* 书签统计栏 */
      .bookmark-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0 12px 0;
        font-size: 0.82rem;
        color: var(--text-muted);
      }
      .bookmark-stats .bs-count {
        color: var(--accent-cyan);
        font-weight: 600;
      }
      .bookmark-stats .bs-clear {
        color: var(--text-muted);
        cursor: pointer;
        background: none;
        border: none;
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: var(--radius-xs);
        transition: all var(--ease-fast);
      }
      .bookmark-stats .bs-clear:hover {
        color: var(--accent-red);
        background: rgba(255, 61, 90, 0.08);
      }
    `;
    document.head.appendChild(style);
  }

  // ============ 查找已有书签的索引 ============
  function findBookmarkIndex(chapterNum, cardTitle) {
    loadBookmarks();
    return bookmarks.findIndex(b =>
      b.chapterNum === chapterNum &&
      b.cardTitle === cardTitle
    );
  }

  // ============ 公开 API ============

  /**
   * 添加书签
   * @param {number} chapterNum 章节号
   * @param {HTMLElement} cardElement 内容卡片元素
   * @returns {object|null} 新添加的书签对象，如果已存在则返回null
   */
  function addBookmark(chapterNum, cardElement) {
    loadBookmarks();

    const info = extractCardInfo(cardElement);
    if (!info || !info.cardTitle) {
      AL.toast('无法提取卡片信息', 'error', 2000);
      return null;
    }

    const num = parseInt(chapterNum);
    const ch = (AL.CHAPTERS || []).find(c => c.num === num);
    const chapterTitle = ch ? ch.title : ('第' + num + '章');

    // 检查是否已存在
    const existingIdx = findBookmarkIndex(num, info.cardTitle);
    if (existingIdx >= 0) {
      AL.toast('该卡片已在书签中', 'info', 2000);
      return null;
    }

    const bookmark = {
      chapterNum: num,
      chapterTitle: chapterTitle,
      cardTitle: info.cardTitle,
      cardSnippet: info.cardSnippet,
      pageUrl: window.location.href,
      savedAt: Date.now()
    };

    bookmarks.push(bookmark);
    saveBookmarks();
    AL.toast('已添加书签 ★', 'success', 2000);

    // 更新页面上的按钮状态
    refreshBookmarkButtons();

    return bookmark;
  }

  /**
   * 移除书签
   * @param {number} chapterNum 章节号
   * @param {string} cardTitle 卡片标题
   * @returns {boolean} 是否成功移除
   */
  function removeBookmark(chapterNum, cardTitle) {
    loadBookmarks();
    const idx = findBookmarkIndex(parseInt(chapterNum), cardTitle);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      saveBookmarks();
      AL.toast('已移除书签', 'info', 2000);
      refreshBookmarkButtons();
      return true;
    }
    return false;
  }

  /**
   * 检查是否已收藏
   * @param {number} chapterNum 章节号
   * @param {string} cardTitle 卡片标题
   * @returns {boolean}
   */
  function isBookmarked(chapterNum, cardTitle) {
    return findBookmarkIndex(parseInt(chapterNum), cardTitle) >= 0;
  }

  /**
   * 获取全部书签
   * @returns {Array}
   */
  function getAllBookmarks() {
    loadBookmarks();
    return [...bookmarks];
  }

  // ============ 渲染书签按钮 ============

  /**
   * 在所有 .content-card 和 .card 元素上添加书签切换按钮
   */
  function renderBookmarkButtons() {
    injectCSS();

    const chapterInfo = getCurrentChapterInfo();
    const cards = [
      ...document.querySelectorAll('.content-card'),
      ...document.querySelectorAll('.card')
    ];

    cards.forEach(card => {
      // 避免重复添加
      if (card.querySelector('.bookmark-btn')) return;

      // 确保卡片是 relative 定位，以便按钮绝对定位
      const computedStyle = window.getComputedStyle(card);
      if (computedStyle.position === 'static') {
        card.style.position = 'relative';
      }

      const info = extractCardInfo(card);
      if (!info || !info.cardTitle) return;

      const btn = document.createElement('button');
      btn.className = 'bookmark-btn';
      btn.title = '添加到书签';
      btn.setAttribute('aria-label', '书签');
      btn.innerHTML = isBookmarked(chapterInfo.chapterNum, info.cardTitle) ? '★' : '☆';

      if (isBookmarked(chapterInfo.chapterNum, info.cardTitle)) {
        btn.classList.add('bookmarked');
        btn.title = '已收藏，点击取消';
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentChapterInfo = getCurrentChapterInfo();

        if (isBookmarked(currentChapterInfo.chapterNum, info.cardTitle)) {
          removeBookmark(currentChapterInfo.chapterNum, info.cardTitle);
          btn.classList.remove('bookmarked');
          btn.innerHTML = '☆';
          btn.title = '添加到书签';
        } else {
          addBookmark(currentChapterInfo.chapterNum, card);
          btn.classList.add('bookmarked', 'just-bookmarked');
          btn.innerHTML = '★';
          btn.title = '已收藏，点击取消';
          // 动画结束后清除动画类
          setTimeout(() => btn.classList.remove('just-bookmarked'), 400);
        }
      });

      card.appendChild(btn);
    });
  }

  /**
   * 刷新页面上所有书签按钮的状态
   */
  function refreshBookmarkButtons() {
    const chapterInfo = getCurrentChapterInfo();
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      const card = btn.closest('.content-card') || btn.closest('.card');
      if (!card) return;

      const info = extractCardInfo(card);
      if (!info || !info.cardTitle) return;

      const bookmarked = isBookmarked(chapterInfo.chapterNum, info.cardTitle);
      if (bookmarked) {
        btn.classList.add('bookmarked');
        btn.innerHTML = '★';
        btn.title = '已收藏，点击取消';
      } else {
        btn.classList.remove('bookmarked');
        btn.innerHTML = '☆';
        btn.title = '添加到书签';
      }
    });
  }

  // ============ 渲染书签列表 ============

  /**
   * 在指定容器中渲染完整的书签列表
   * @param {string} containerId 容器元素的ID
   */
  function renderBookmarkList(containerId) {
    injectCSS();
    loadBookmarks();

    const container = document.getElementById(containerId);
    if (!container) return;

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="bookmark-list">
          <div class="bookmark-list-empty">
            📑 还没有收藏的书签<br>
            <span style="font-size:0.8rem;">浏览章节时点击卡片右上角的 ☆ 即可收藏</span>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="bookmark-stats">
        <span>共 <span class="bs-count">${bookmarks.length}</span> 个书签</span>
        <button class="bs-clear" id="bookmarksClearAll">清空全部</button>
      </div>
      <div class="bookmark-list">
        ${bookmarks.map((b, idx) => `
          <div class="bookmark-item" data-bookmark-index="${idx}">
            <div class="bm-star">★</div>
            <div class="bm-content">
              <div class="bm-chapter">第${b.chapterNum}章 · ${AL.escapeHtml(b.chapterTitle)}</div>
              <div class="bm-title">${AL.escapeHtml(b.cardTitle)}</div>
              <div class="bm-snippet">${AL.escapeHtml(b.cardSnippet)}</div>
            </div>
            <button class="bm-remove" data-chapter="${b.chapterNum}" data-title="${AL.escapeHtml(b.cardTitle)}" title="移除书签">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    // 绑定点击事件：点击书签跳转到原页面
    container.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // 如果点击的是删除按钮则不跳转
        if (e.target.closest('.bm-remove')) return;
        const idx = parseInt(item.dataset.bookmarkIndex);
        if (idx >= 0 && idx < bookmarks.length) {
          window.location.href = bookmarks[idx].pageUrl;
        }
      });
    });

    // 绑定删除按钮事件
    container.querySelectorAll('.bm-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chNum = parseInt(btn.dataset.chapter);
        const title = btn.dataset.title;
        removeBookmark(chNum, title);
        renderBookmarkList(containerId);
      });
    });

    // 绑定清空全部按钮
    const clearBtn = container.querySelector('#bookmarksClearAll');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有书签吗？此操作不可恢复。')) {
          bookmarks = [];
          saveBookmarks();
          AL.toast('所有书签已清除', 'info', 2000);
          renderBookmarkList(containerId);
        }
      });
    }
  }

  // ============ 初始化 ============
  function init() {
    injectCSS();
    loadBookmarks();

    // 在章节页面自动渲染书签按钮
    renderBookmarkButtons();

    // 监听 DOM 变化（动态加载的内容），延迟重新渲染按钮
    const observer = new MutationObserver(AL.debounce(() => {
      renderBookmarkButtons();
    }, 500));

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============ 公开 API ============
  AL.Bookmarks = {
    init,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getAllBookmarks,
    renderBookmarkButtons,
    renderBookmarkList
  };

  // ============ 自动初始化 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
