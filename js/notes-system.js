/**
 * Notes System — Agent 学习平台
 * 笔记管理功能
 */
(function(AL) {
  'use strict';

  const NOTES_KEY = 'notes';
  let isOpen = false;

  function init() {
    const toggleBtn = AL.$('#notesToggle');
    const closeBtn = AL.$('#notesClose');
    const saveBtn = AL.$('#notesSaveBtn');
    const deleteAllBtn = AL.$('#notesDeleteAll');

    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', toggle);
    if (saveBtn) saveBtn.addEventListener('click', saveNote);
    if (deleteAllBtn) deleteAllBtn.addEventListener('click', deleteAllNotes);
  }

  function toggle() {
    isOpen = !isOpen;
    const panel = AL.$('#notesPanel');
    if (panel) panel.classList.toggle('active', isOpen);
    if (isOpen) renderNotes();
  }

  function getNotes() {
    return AL.Store.get(NOTES_KEY, []);
  }

  function saveNote() {
    const inputEl = AL.$('#noteInput');
    const chapterEl = AL.$('#noteChapter');
    const content = inputEl?.value.trim();
    if (!content) { AL.toast('请输入笔记内容', 'error'); return; }

    const notes = getNotes();
    notes.unshift({
      id: Date.now(),
      chapter: parseInt(chapterEl?.value || '1'),
      chapterName: chapterEl?.selectedOptions[0]?.text || '未知章节',
      content,
      time: AL.formatDate(new Date())
    });

    AL.Store.set(NOTES_KEY, notes.slice(0, 100));
    if (inputEl) inputEl.value = '';
    renderNotes();
    AL.toast('笔记已保存', 'success');
  }

  function deleteNote(id) {
    let notes = getNotes();
    notes = notes.filter(n => n.id !== id);
    AL.Store.set(NOTES_KEY, notes);
    renderNotes();
    AL.toast('笔记已删除', 'info');
  }

  function deleteAllNotes() {
    if (confirm('确定要删除所有笔记吗？此操作不可恢复！')) {
      AL.Store.set(NOTES_KEY, []);
      renderNotes();
      AL.toast('所有笔记已清除', 'info');
    }
  }

  function renderNotes() {
    const listEl = AL.$('#notesList');
    if (!listEl) return;

    const notes = getNotes();
    if (notes.length === 0) {
      listEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:40px;">还没有笔记<br>📝 在下方写下你的学习心得</div>';
      return;
    }

    listEl.innerHTML = notes.map(n => `
      <div class="note-item" style="padding:12px;margin-bottom:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
        <div style="font-size:11px;color:var(--accent-cyan);font-weight:600;display:flex;justify-content:space-between;">
          <span>${AL.escapeHtml(n.chapterName)}</span>
          <span style="color:var(--text-muted);">${n.time}</span>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:6px;line-height:1.6;">${AL.escapeHtml(n.content)}</div>
        <button onclick="AgentLearn.Notes.deleteNote(${n.id})" style="background:none;border:none;color:var(--accent-red);cursor:pointer;font-size:12px;margin-top:6px;">🗑 删除</button>
      </div>
    `).join('');
  }

  // Expose for inline onclick
  AL.Notes = { init, toggle, saveNote, deleteNote, deleteAllNotes, renderNotes, getNotes };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
