
/**
 * Navigation Manager — Agent 学习平台
 * 侧边栏导航、滚动监听、移动端菜单
 */
(function(AL) {
  'use strict';

  function init() {
    // Mobile menu
    const mobileBtn = AL.$('#mobileMenuBtn');
    const sidebar = AL.$('#sidebar');
    const overlay = AL.$('#sidebarOverlay');

    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
      });
    }

    // Close sidebar on nav click (mobile)
    AL.$$('.nav-link, .toc-item').forEach(link => {
      link.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
      });
    });

    // Scroll spy
    window.addEventListener('scroll', AL.throttle(updateActiveNav, 100));

    // Initial update
    updateActiveNav();
  }

  function updateActiveNav() {
    const sections = document.querySelectorAll('[data-chapter], .chapter, section[id]');
    const navLinks = AL.$$('.nav-link[data-chapter], .toc-item[data-chapter]');

    let currentChapter = null;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 180) {
        const ch = section.dataset.chapter || section.id.replace('chapter', '');
        currentChapter = ch;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.chapter === currentChapter) {
        link.classList.add('active');
      }
    });
  }

  AL.Navigation = { init, updateActiveNav };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
