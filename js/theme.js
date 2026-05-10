/**
 * Theme Manager — Agent 学习平台
 * 暗色/亮色主题切换管理
 */
(function(AL) {
  'use strict';

  const THEME_KEY = 'theme';

  function init() {
    const saved = AL.Store.get(THEME_KEY, 'dark');
    applyTheme(saved);

    // 绑定切换按钮
    const btn = AL.$('#themeToggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      updateToggleIcon(saved);
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    AL.Store.set(THEME_KEY, theme);
    updateToggleIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    AL.toast(`已切换为${next === 'dark' ? '暗色' : '亮色'}主题`, 'info', 2000);
  }

  function updateToggleIcon(theme) {
    const btn = AL.$('#themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '🌙' : '☀️';
      btn.title = theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式';
    }
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // Public API
  AL.Theme = { init, applyTheme, toggleTheme, getCurrentTheme };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
