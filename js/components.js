/**
 * Shared Components Renderer — Agent 学习平台
 * 集中渲染 Header/Sidebar/Search/Sim/Notes/Toast，消除跨页面 HTML 重复
 */
(function(AL) {
  'use strict';

  const CHAPTERS = AL.CHAPTERS || [];
  const TOOLS = AL.TOOLS || [];
  const REFERENCES = AL.REFERENCES || [];

  function init() {
    renderHeader();
    renderSidebar();
    renderSearchPanel();
    renderSimPanel();
    renderNotesPanel();
    renderToastContainer();
  }

  function renderHeader() {
    const container = document.getElementById('app-header');
    if (!container) return;
    container.innerHTML = `
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="btn btn-icon" id="mobileMenuBtn" aria-label="菜单">☰</button>
          <a href="${AL.PAGE_BASE || '.'}/index.html" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
            <div class="logo-icon">A</div>
            <span class="logo-text">AI Agent 学习指南</span>
          </a>
        </div>
        <div class="top-bar-right">
          <button class="btn btn-icon" id="searchBtn" title="搜索 (Ctrl+K)">🔍</button>
          <button class="btn btn-icon" id="themeToggle" title="切换主题">🌙</button>
          <button class="btn btn-icon" id="resetBtn" title="重置进度">🔄</button>
        </div>
      </header>`;
  }

  function renderSidebar() {
    const container = document.getElementById('app-sidebar');
    if (!container) return;

    const base = AL.PAGE_BASE || '.';
    const chaptersDir = (AL.PAGE_BASE === '..') ? 'chapters/' : 'chapters/';
    const toolsDir = (AL.PAGE_BASE === '..') ? '' : '../tools/';
    const refDir = (AL.PAGE_BASE === '..') ? '' : '../reference/';

    let chLinks = '';
    CHAPTERS.forEach(ch => {
      const activeClass = (AL.CURRENT_CHAPTER === ch.num) ? ' active' : '';
      const href = `${chaptersDir}${ch.file}`;
      chLinks += `<a href="${href}" class="nav-link${activeClass}" data-chapter="${ch.num}">${String(ch.num).padStart(2,'0')} · ${ch.title}</a>\n`;
    });

    let toolLinks = '';
    TOOLS.forEach(t => {
      toolLinks += `<a href="${toolsDir}tools/${t.file}" class="nav-link">${t.icon} ${t.title}</a>\n`;
    });

    let refLinks = '';
    REFERENCES.forEach(r => {
      refLinks += `<a href="${refDir}reference/${r.file}" class="nav-link">${r.icon} ${r.title}</a>\n`;
    });

    container.innerHTML = `
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-section-title">📚 学习章节</div>
        ${chLinks}
        <div class="sidebar-section-title">🛠️ 学习工具</div>
        ${toolLinks}
        <div class="sidebar-section-title">📖 参考资料</div>
        ${refLinks}
        <div class="progress-card">
          <div class="progress-header">
            <span>学习进度</span>
            <span id="progressPercent">0%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progressFill" style="width:0%"></div>
          </div>
        </div>
      </aside>`;
  }

  function renderSearchPanel() {
    const container = document.getElementById('app-search-panel');
    if (!container) return;
    container.innerHTML = `
      <div class="search-panel" id="searchPanel">
        <div style="position:relative;max-width:560px;margin:0 auto;">
          <input type="text" class="search-input" id="searchInput" placeholder="搜索学习内容... (Esc 关闭)">
          <button style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;" id="searchClose">✕</button>
        </div>
        <div class="search-results" id="searchResults"></div>
      </div>`;
  }

  function renderSimPanel() {
    const container = document.getElementById('app-sim-panel');
    if (!container) return;
    container.innerHTML = `
      <button class="sim-toggle" id="simToggle" title="AI Agent 模拟器">🤖</button>
      <div class="sim-panel" id="simPanel">
        <div class="sim-header">
          <div><span class="sim-status-dot"></span> <strong>Agent 模拟器</strong></div>
          <button class="sim-close" id="simClose">✕</button>
        </div>
        <div class="sim-messages" id="simMessages">
          <div class="sim-msg agent">
            👋 你好！我是 AI Agent 模拟器。输入你的问题，观察我是如何<strong>思考→行动→观察</strong>的！
          </div>
        </div>
        <div class="sim-input-area">
          <textarea class="sim-input" id="simInput" placeholder="输入你的请求..." rows="1"></textarea>
          <button class="btn btn-primary btn-sm" id="simSend" style="flex-shrink:0;">发送</button>
        </div>
      </div>`;
  }

  function renderNotesPanel() {
    const container = document.getElementById('app-notes-panel');
    if (!container) return;
    container.innerHTML = `
      <button class="notes-toggle" id="notesToggle" title="笔记">📝</button>
      <div class="notes-panel" id="notesPanel">
        <div class="sim-header">
          <strong>📒 我的笔记</strong>
          <button class="sim-close" id="notesClose">✕</button>
        </div>
        <div class="sim-messages" id="notesList" style="overflow-y:auto;">
          <div style="color:var(--text-muted);text-align:center;padding:40px;">还没有笔记<br>📝 在学习过程中记录心得</div>
        </div>
        <div style="padding:12px;border-top:1px solid var(--border-color);">
          <textarea id="noteInput" placeholder="写笔记..." style="width:100%;padding:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);font-size:13px;resize:none;min-height:70px;font-family:var(--font-body);outline:none;"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <select id="noteChapter" style="flex:1;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-size:12px;">
              ${CHAPTERS.map(ch => `<option value="${ch.num}">第${ch.num}章：${ch.title}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" id="notesSaveBtn">保存</button>
          </div>
        </div>
      </div>`;
  }

  function renderToastContainer() {
    const container = document.getElementById('app-toast-container');
    if (!container) return;
    container.innerHTML = '<div class="toast-container" id="toastContainer"></div>';
  }

  // Public API
  AL.Components = { init, renderHeader, renderSidebar, renderSearchPanel, renderSimPanel, renderNotesPanel, renderToastContainer };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
