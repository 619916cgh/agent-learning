/**
 * Search Engine — Agent 学习平台
 * 全文搜索功能
 */
(function(AL) {
  'use strict';

  let panel, input, results, isOpen = false;

  function init() {
    panel = AL.$('#searchPanel');
    input = AL.$('#searchInput');
    results = AL.$('#searchResults');

    if (!panel || !input) return;

    const toggleBtn = AL.$('#searchBtn');
    const closeBtn = AL.$('#searchClose');

    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);

    input.addEventListener('input', AL.debounce(performSearch, 200));

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? close() : open();
      }
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  function open() {
    panel.classList.add('active');
    isOpen = true;
    setTimeout(() => input.focus(), 150);
  }

  function close() {
    panel.classList.remove('active');
    isOpen = false;
    input.value = '';
    results.innerHTML = '';
  }

  function toggle() { isOpen ? close() : open(); }

  function performSearch() {
    const query = input.value.trim().toLowerCase();
    if (!query) { results.innerHTML = ''; return; }

    // 搜索所有可搜索的内容
    const searchable = document.querySelectorAll('[data-searchable], .content-card, .card, article, .chapter-content');
    const found = [];

    searchable.forEach((el, idx) => {
      const text = el.textContent.toLowerCase();
      if (text.includes(query)) {
        const snippet = el.textContent.replace(/\s+/g, ' ').substring(0, 150);
        // 高亮匹配词
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        const highlighted = snippet.replace(regex, '<mark style="background:var(--accent-cyan);color:#000;padding:1px 4px;border-radius:2px;">$1</mark>');

        const chapterEl = el.closest('[data-chapter]');
        const chapterName = chapterEl ? chapterEl.dataset.chapter : '';

        found.push({
          chapter: chapterName,
          snippet: highlighted,
          element: el,
          idx
        });
      }
    });

    if (found.length === 0) {
      results.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">未找到相关内容</div>';
    } else {
      results.innerHTML = found.slice(0, 25).map(f => `
        <div class="search-result-item" data-idx="${f.idx}">
          <div style="font-size:11px;color:var(--accent-cyan);font-weight:600;">${f.chapter}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${f.snippet}</div>
        </div>
      `).join('');

      results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.idx);
          const target = found.find(f => f.idx === idx);
          if (target) {
            close();
            AL.scrollTo(target.element, 100);
            target.element.style.boxShadow = '0 0 40px rgba(0,229,255,0.4)';
            setTimeout(() => { target.element.style.boxShadow = ''; }, 2500);
          }
        });
      });
    }
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  AL.Search = { init, open, close, toggle };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
