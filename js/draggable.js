const AgentLearn = window.AgentLearn || {};
(function(AL) {
  'use strict';

  var LONG_PRESS_DURATION = 300; // 长按 300ms 触发拖拽
  var STORAGE_KEYS = { sim: 'al_sim_pos', notes: 'al_notes_pos' };

  function init() {
    var simToggle = document.getElementById('simToggle');
    var notesToggle = document.getElementById('notesToggle');
    if (simToggle) setupDraggable(simToggle, STORAGE_KEYS.sim);
    if (notesToggle) setupDraggable(notesToggle, STORAGE_KEYS.notes);
  }

  function setupDraggable(el, storageKey) {
    restorePosition(el, storageKey);

    var longPressTimer = null;
    var isDragging = false;
    var startX, startY;
    var startRight, startBottom;
    var hasMoved = false;

    function getComputedLR() {
      var rect = el.getBoundingClientRect();
      return {
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.bottom
      };
    }

    function onStart(e) {
      // 阻止默认行为以避免触摸时页面滚动等问题
      if (e.touches && e.touches.length > 1) return; // 多指忽略
      var point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;

      var pos = getComputedLR();
      startRight = pos.right;
      startBottom = pos.bottom;
      hasMoved = false;

      longPressTimer = setTimeout(function() {
        isDragging = true;
        el.classList.add('dragging');
        el.style.transition = 'none';
        el.style.transform = 'scale(1.15)';
      }, LONG_PRESS_DURATION);
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();

      var point = e.touches ? e.touches[0] : e;
      var dx = startX - point.clientX;
      var dy = startY - point.clientY;

      var newRight = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startRight + dx));
      var newBottom = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startBottom + dy));

      el.style.right = newRight + 'px';
      el.style.bottom = newBottom + 'px';
      el.style.left = 'auto';
      el.style.top = 'auto';

      if (Math.abs(point.clientX - startX) > 2 || Math.abs(point.clientY - startY) > 2) {
        hasMoved = true;
      }
    }

    function onEnd(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isDragging) {
        isDragging = false;
        el.classList.remove('dragging');
        el.style.transform = '';
        el.style.transition = '';

        if (hasMoved) {
          savePosition(el, storageKey);
          // 拖拽结束后阻止本次 click 冒泡，避免误触发 toggle 面板
          var block = function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            el.removeEventListener('click', block, true);
          };
          el.addEventListener('click', block, true);
        }
      }
    }

    // 鼠标事件
    el.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // 触摸事件
    el.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  function savePosition(el, key) {
    try {
      var pos = { right: parseInt(el.style.right, 10), bottom: parseInt(el.style.bottom, 10) };
      localStorage.setItem(key, JSON.stringify(pos));
    } catch (ignored) {}
  }

  function restorePosition(el, key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return;
      var pos = JSON.parse(raw);
      if (pos && typeof pos.right === 'number' && typeof pos.bottom === 'number') {
        el.style.right = pos.right + 'px';
        el.style.bottom = pos.bottom + 'px';
        el.style.left = 'auto';
        el.style.top = 'auto';
      }
    } catch (ignored) {}
  }

  AL.Draggable = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(AgentLearn);
