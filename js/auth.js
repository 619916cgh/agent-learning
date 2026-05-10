/**
 * Auth Module — Agent 学习平台
 * 用户认证与管理 (localStorage 模式)
 */
const AgentLearn = window.AgentLearn || {};

(function(AL) {
  'use strict';

  const BASE_PREFIX = 'al_';
  const AUTH_KEY = 'users';
  const TOTAL_CHAPTERS = 16;

  // ============ 内部工具 ============

  function getAuthStore() {
    try {
      return JSON.parse(localStorage.getItem(BASE_PREFIX + AUTH_KEY)) || { users: [], currentUser: null };
    } catch (e) {
      return { users: [], currentUser: null };
    }
  }

  function setAuthStore(data) {
    localStorage.setItem(BASE_PREFIX + AUTH_KEY, JSON.stringify(data));
  }

  function hashPassword(pwd) {
    // 简单编码用于 localStorage 演示
    return btoa(pwd);
  }

  function setUserPrefix(username) {
    AL.Store._prefix = 'al_data_' + username + '_';
  }

  function resetPrefix() {
    AL.Store._prefix = BASE_PREFIX;
  }

  function updateAuthButton() {
    var btn = AL.$('#authBtn');
    var store = getAuthStore();
    if (btn) {
      if (store.currentUser) {
        btn.innerHTML = '&#x1F464; ' + AL.escapeHtml(store.currentUser);
        btn.title = '点击查看账户 (' + store.currentUser + ')';
        btn.style.background = 'rgba(0, 229, 255, 0.12)';
        btn.style.borderColor = 'var(--accent-cyan)';
        btn.style.color = 'var(--accent-cyan)';
      } else {
        btn.innerHTML = '&#x1F464; 登录';
        btn.title = '登录或注册';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }
  }

  // ============ 核心 API ============

  function login(username, password) {
    var store = getAuthStore();
    var user = store.users.find(function(u) {
      return u.username === username;
    });
    if (!user) {
      AL.toast('用户不存在，请先注册', 'error');
      return false;
    }
    if (user.passwordHash !== hashPassword(password)) {
      AL.toast('密码错误', 'error');
      return false;
    }
    store.currentUser = username;
    setAuthStore(store);
    setUserPrefix(username);
    updateAuthButton();
    AL.toast('欢迎回来，' + username + '！', 'success');
    // 重新加载页面以使数据前缀生效
    setTimeout(function() { window.location.reload(); }, 600);
    return true;
  }

  function register(username, password) {
    if (!username || username.trim().length < 2) {
      AL.toast('用户名至少需要2个字符', 'error');
      return false;
    }
    if (!password || password.length < 4) {
      AL.toast('密码至少需要4个字符', 'error');
      return false;
    }
    var store = getAuthStore();
    if (store.users.some(function(u) { return u.username === username; })) {
      AL.toast('该用户名已被注册', 'error');
      return false;
    }
    store.users.push({
      username: username.trim(),
      passwordHash: hashPassword(password),
      role: 'user',
      createdAt: new Date().toISOString()
    });
    store.currentUser = username.trim();
    setAuthStore(store);
    setUserPrefix(username.trim());
    updateAuthButton();
    AL.toast('注册成功！欢迎，' + username.trim() + '！', 'success');
    // 重新加载页面以使数据前缀生效
    setTimeout(function() { window.location.reload(); }, 600);
    return true;
  }

  function logout() {
    var store = getAuthStore();
    store.currentUser = null;
    setAuthStore(store);
    resetPrefix();
    updateAuthButton();
    AL.toast('已退出登录', 'info');
    setTimeout(function() { window.location.reload(); }, 400);
  }

  function getCurrentUser() {
    var store = getAuthStore();
    return store.currentUser || null;
  }

  function isAdmin() {
    var store = getAuthStore();
    var cur = store.currentUser;
    if (!cur) return false;
    var user = store.users.find(function(u) { return u.username === cur; });
    return user && user.role === 'admin';
  }

  function getAllUsers() {
    var store = getAuthStore();
    return store.users.filter(function(u) { return u.role !== 'admin'; });
  }

  function getUserProgress(username) {
    var progressKey = 'al_data_' + username + '_progress';
    var notesKey = 'al_data_' + username + '_notes';
    var progress = null;
    var notes = null;
    try {
      var rawP = localStorage.getItem(progressKey);
      progress = rawP ? JSON.parse(rawP) : null;
      var rawN = localStorage.getItem(notesKey);
      notes = rawN ? JSON.parse(rawN) : null;
    } catch (e) {
      progress = null;
      notes = null;
    }
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
      if (progress.lastVisit) {
        lastVisit = progress.lastVisit;
      }
    }
    return {
      chaptersRead: chaptersRead,
      quizzesDone: quizzesDone,
      lastVisit: lastVisit,
      notesCount: notes ? (notes.length || 0) : 0
    };
  }

  // ============ UI 渲染 ============

  var modalEl = null;
  var activeTab = 'login';

  function renderLoginUI() {
    // 如果已登录，显示用户面板
    var store = getAuthStore();
    if (store.currentUser) {
      renderUserPanel();
      return;
    }
    renderAuthModal();
  }

  function renderAuthModal() {
    // 移除旧 modal
    if (modalEl) {
      modalEl.remove();
    }

    modalEl = document.createElement('div');
    modalEl.className = 'auth-modal-overlay';
    modalEl.innerHTML = '\
      <div class="auth-modal-card">\
        <button class="auth-modal-close" id="authModalClose">&times;</button>\
        <div class="auth-modal-tabs">\
          <button class="auth-tab active" data-tab="login">登录</button>\
          <button class="auth-tab" data-tab="register">注册</button>\
        </div>\
        <div class="auth-tab-content" id="authTabLogin">\
          <form id="loginForm" autocomplete="off">\
            <label class="auth-label">用户名</label>\
            <input type="text" class="auth-input" id="loginUser" placeholder="请输入用户名" autocomplete="off">\
            <label class="auth-label">密码</label>\
            <input type="password" class="auth-input" id="loginPass" placeholder="请输入密码" autocomplete="off">\
            <button type="submit" class="auth-submit-btn">登录</button>\
          </form>\
          <p class="auth-hint">演示账户: admin / admin123</p>\
        </div>\
        <div class="auth-tab-content auth-tab-hidden" id="authTabRegister">\
          <form id="registerForm" autocomplete="off">\
            <label class="auth-label">用户名</label>\
            <input type="text" class="auth-input" id="regUser" placeholder="请输入用户名（至少2个字符）" autocomplete="off">\
            <label class="auth-label">密码</label>\
            <input type="password" class="auth-input" id="regPass" placeholder="请输入密码（至少4个字符）" autocomplete="off">\
            <label class="auth-label">确认密码</label>\
            <input type="password" class="auth-input" id="regPass2" placeholder="请再次输入密码" autocomplete="off">\
            <button type="submit" class="auth-submit-btn">注册</button>\
          </form>\
        </div>\
      </div>\
    ';

    document.body.appendChild(modalEl);

    // 绑定事件
    modalEl.addEventListener('click', function(e) {
      if (e.target === modalEl) closeModal();
    });

    var closeBtn = AL.$('#authModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Tab 切换
    var tabs = modalEl.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.dataset.tab;
        switchTab(target);
      });
    });

    // 登录表单
    var loginForm = AL.$('#loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var u = AL.$('#loginUser');
        var p = AL.$('#loginPass');
        if (u && p) {
          login(u.value, p.value);
          closeModal();
        }
      });
    }

    // 注册表单
    var regForm = AL.$('#registerForm');
    if (regForm) {
      regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var u = AL.$('#regUser');
        var p = AL.$('#regPass');
        var p2 = AL.$('#regPass2');
        if (u && p && p2) {
          if (p.value !== p2.value) {
            AL.toast('两次输入的密码不一致', 'error');
            return;
          }
          register(u.value, p.value);
          closeModal();
        }
      });
    }

    // 键盘 ESC 关闭
    document.addEventListener('keydown', handleEscKey);

    // 显示动画
    requestAnimationFrame(function() {
      modalEl.classList.add('auth-modal-visible');
    });

    activeTab = 'login';
  }

  function renderUserPanel() {
    if (modalEl) modalEl.remove();

    var store = getAuthStore();
    var curUser = store.currentUser;
    var isUserAdmin = isAdmin();
    var progress = getUserProgress(curUser);

    modalEl = document.createElement('div');
    modalEl.className = 'auth-modal-overlay';

    var lastActiveStr = '暂无';
    if (progress.lastVisit) {
      lastActiveStr = AL.formatDate(new Date(progress.lastVisit));
    }

    modalEl.innerHTML = '\
      <div class="auth-modal-card" style="max-width:400px;">\
        <button class="auth-modal-close" id="authModalClose">&times;</button>\
        <div style="text-align:center;padding-top:8px;">\
          <div class="auth-avatar">&#x1F464;</div>\
          <h3 style="margin:12px 0 4px;font-size:20px;">' + AL.escapeHtml(curUser) + '</h3>\
          <span style="font-size:12px;padding:2px 10px;border-radius:999px;background:rgba(0,229,255,0.1);color:var(--accent-cyan);font-weight:600;">' + (isUserAdmin ? '管理员' : '普通用户') + '</span>\
        </div>\
        <div class="auth-user-stats">\
          <div class="auth-stat-row"><span>已读章节</span><span class="auth-stat-val">' + progress.chaptersRead + ' / ' + TOTAL_CHAPTERS + '</span></div>\
          <div class="auth-stat-row"><span>完成测验</span><span class="auth-stat-val">' + progress.quizzesDone + ' / ' + TOTAL_CHAPTERS + '</span></div>\
          <div class="auth-stat-row"><span>笔记数量</span><span class="auth-stat-val">' + progress.notesCount + ' 条</span></div>\
          <div class="auth-stat-row"><span>最后活跃</span><span class="auth-stat-val" style="font-size:12px;">' + lastActiveStr + '</span></div>\
        </div>\
        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">\
          ' + (isUserAdmin ? '<button class="auth-submit-btn" id="btnGoAdmin" style="flex:1;">管理面板</button>' : '') + '\
          <button class="auth-logout-btn" id="btnLogout">退出登录</button>\
        </div>\
      </div>\
    ';

    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function(e) {
      if (e.target === modalEl) closeModal();
    });

    var closeBtn = AL.$('#authModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    var logoutBtn = AL.$('#btnLogout');
    if (logoutBtn) logoutBtn.addEventListener('click', function() { logout(); closeModal(); });

    var adminBtn = AL.$('#btnGoAdmin');
    if (adminBtn) adminBtn.addEventListener('click', function() {
      window.location.href = 'admin.html';
    });

    document.addEventListener('keydown', handleEscKey);

    requestAnimationFrame(function() {
      modalEl.classList.add('auth-modal-visible');
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    var allTabs = document.querySelectorAll('.auth-tab');
    allTabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    var loginTab = document.getElementById('authTabLogin');
    var regTab = document.getElementById('authTabRegister');
    if (loginTab) loginTab.classList.toggle('auth-tab-hidden', tab !== 'login');
    if (regTab) regTab.classList.toggle('auth-tab-hidden', tab !== 'register');
  }

  function closeModal() {
    if (modalEl) {
      modalEl.classList.remove('auth-modal-visible');
      setTimeout(function() {
        if (modalEl) { modalEl.remove(); modalEl = null; }
      }, 280);
    }
    document.removeEventListener('keydown', handleEscKey);
  }

  function handleEscKey(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  function renderAdminPanel(targetSelector) {
    var target = typeof targetSelector === 'string'
      ? AL.$(targetSelector)
      : targetSelector;

    if (!target) return;

    // 检查是否是管理员
    if (!isAdmin()) {
      target.innerHTML = '\
        <div style="text-align:center;padding:60px 20px;">\
          <div style="font-size:64px;margin-bottom:16px;">&#x1F512;</div>\
          <h2 style="margin-bottom:8px;">需要管理员权限</h2>\
          <p style="color:var(--text-muted);margin-bottom:24px;">请使用管理员账户登录以访问此页面</p>\
          <button class="auth-submit-btn" id="btnAdminLogin" style="max-width:240px;margin:0 auto;">登录管理员账户</button>\
        </div>\
      ';
      var loginBtn = AL.$('#btnAdminLogin');
      if (loginBtn) loginBtn.addEventListener('click', renderLoginUI);
      return;
    }

    var store = getAuthStore();
    var allUsers = store.users.filter(function(u) { return u.role !== 'admin'; });

    if (allUsers.length === 0) {
      target.innerHTML = '\
        <div style="text-align:center;padding:60px 20px;">\
          <h2>管理员面板</h2>\
          <p style="color:var(--text-muted);">暂无注册用户</p>\
        </div>\
      ';
      return;
    }

    var rows = '';
    allUsers.forEach(function(u) {
      var info = getUserProgress(u.username);
      var lastActive = '暂无';
      if (info.lastVisit) {
        lastActive = AL.formatDate(new Date(info.lastVisit));
      }
      var createdAt = '未知';
      if (u.createdAt) {
        createdAt = AL.formatDate(new Date(u.createdAt));
      }
      rows += '\
        <tr>\
          <td style="font-weight:600;">' + AL.escapeHtml(u.username) + '</td>\
          <td>' + info.chaptersRead + ' / ' + TOTAL_CHAPTERS + '</td>\
          <td>' + info.quizzesDone + ' / ' + TOTAL_CHAPTERS + '</td>\
          <td>' + info.notesCount + '</td>\
          <td style="font-size:12px;">' + lastActive + '</td>\
          <td style="font-size:11px;">' + createdAt + '</td>\
        </tr>\
      ';
    });

    target.innerHTML = '\
      <div class="admin-panel">\
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px;">\
          <div>\
            <h2 style="margin:0;">管理员面板</h2>\
            <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px;">共 ' + allUsers.length + ' 位注册用户</p>\
          </div>\
          <div style="display:flex;gap:8px;flex-wrap:wrap;">\
            <button class="btn btn-sm" id="btnRefreshAdmin">刷新数据</button>\
            <button class="btn btn-sm" id="btnBackToSite">返回首页</button>\
          </div>\
        </div>\
        <div class="table-wrap">\
          <table>\
            <thead>\
              <tr>\
                <th>用户名</th>\
                <th>已读章节</th>\
                <th>完成测验</th>\
                <th>笔记数</th>\
                <th>最后活跃</th>\
                <th>注册时间</th>\
              </tr>\
            </thead>\
            <tbody>' + rows + '</tbody>\
          </table>\
        </div>\
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px;">提示：点击 <strong>登录</strong> 按钮可切换账户。管理员账户：admin / admin123</p>\
      </div>\
    ';

    // 绑定按钮事件
    var refreshBtn = AL.$('#btnRefreshAdmin');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        renderAdminPanel(target);
      });
    }
    var backBtn = AL.$('#btnBackToSite');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
    }
  }

  // ============ CSS 注入 ============

  function injectStyles() {
    if (document.getElementById('auth-styles')) return;

    var style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = '\
/* Auth Modal Overlay */\
.auth-modal-overlay {\
  position: fixed;\
  inset: 0;\
  background: rgba(0, 0, 0, 0.6);\
  backdrop-filter: blur(8px);\
  -webkit-backdrop-filter: blur(8px);\
  z-index: 300;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  opacity: 0;\
  pointer-events: none;\
  transition: opacity 0.28s ease;\
}\
.auth-modal-visible {\
  opacity: 1;\
  pointer-events: all;\
}\
.auth-modal-card {\
  background: var(--bg-secondary);\
  border: 1px solid var(--accent-cyan);\
  border-radius: var(--radius-lg);\
  padding: 28px 32px;\
  width: 380px;\
  max-width: calc(100vw - 32px);\
  box-shadow: 0 0 48px rgba(0, 229, 255, 0.2), 0 16px 48px rgba(0, 0, 0, 0.5);\
  position: relative;\
  animation: authCardIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\
}\
@keyframes authCardIn {\
  from { opacity: 0; transform: scale(0.9) translateY(20px); }\
  to { opacity: 1; transform: scale(1) translateY(0); }\
}\
.auth-modal-close {\
  position: absolute;\
  top: 12px;\
  right: 16px;\
  background: none;\
  border: none;\
  color: var(--text-muted);\
  font-size: 24px;\
  cursor: pointer;\
  transition: color 0.15s ease;\
  line-height: 1;\
  font-family: var(--font-body);\
}\
.auth-modal-close:hover {\
  color: var(--accent-red);\
}\
.auth-modal-tabs {\
  display: flex;\
  gap: 4px;\
  margin-bottom: 24px;\
  background: var(--bg-tertiary);\
  border-radius: var(--radius-md);\
  padding: 4px;\
}\
.auth-tab {\
  flex: 1;\
  padding: 10px;\
  background: transparent;\
  border: none;\
  border-radius: var(--radius-sm);\
  color: var(--text-muted);\
  font-size: 14px;\
  font-weight: 600;\
  cursor: pointer;\
  transition: all 0.2s ease;\
  font-family: var(--font-body);\
}\
.auth-tab:hover {\
  color: var(--text-primary);\
}\
.auth-tab.active {\
  background: var(--bg-card);\
  color: var(--accent-cyan);\
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.15);\
}\
.auth-tab-content {\
  display: block;\
}\
.auth-tab-hidden {\
  display: none;\
}\
.auth-label {\
  display: block;\
  font-size: 12px;\
  font-weight: 600;\
  color: var(--text-secondary);\
  margin-bottom: 6px;\
  margin-top: 16px;\
  text-transform: uppercase;\
  letter-spacing: 0.04em;\
}\
.auth-label:first-of-type {\
  margin-top: 0;\
}\
.auth-input {\
  width: 100%;\
  padding: 12px 16px;\
  background: var(--bg-tertiary);\
  border: 2px solid var(--border-color);\
  border-radius: var(--radius-md);\
  color: var(--text-primary);\
  font-size: 14px;\
  font-family: var(--font-body);\
  outline: none;\
  transition: border-color 0.2s ease, box-shadow 0.2s ease;\
}\
.auth-input:focus {\
  border-color: var(--accent-cyan);\
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.12);\
}\
.auth-input::placeholder {\
  color: var(--text-muted);\
}\
.auth-submit-btn {\
  width: 100%;\
  margin-top: 20px;\
  padding: 13px;\
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));\
  border: none;\
  border-radius: var(--radius-md);\
  color: #fff;\
  font-size: 15px;\
  font-weight: 700;\
  cursor: pointer;\
  transition: all 0.25s ease;\
  font-family: var(--font-body);\
  box-shadow: 0 4px 16px rgba(0, 229, 255, 0.25);\
}\
.auth-submit-btn:hover {\
  box-shadow: 0 6px 28px rgba(0, 229, 255, 0.45);\
  transform: translateY(-2px);\
}\
.auth-logout-btn {\
  flex: 1;\
  padding: 12px;\
  background: var(--bg-tertiary);\
  border: 1px solid var(--accent-red);\
  border-radius: var(--radius-md);\
  color: var(--accent-red);\
  font-size: 14px;\
  font-weight: 600;\
  cursor: pointer;\
  transition: all 0.2s ease;\
  font-family: var(--font-body);\
}\
.auth-logout-btn:hover {\
  background: rgba(255, 61, 90, 0.1);\
  box-shadow: 0 0 16px rgba(255, 61, 90, 0.2);\
}\
.auth-hint {\
  text-align: center;\
  font-size: 12px;\
  color: var(--text-muted);\
  margin-top: 16px;\
  margin-bottom: 0;\
}\
.auth-avatar {\
  width: 72px;\
  height: 72px;\
  border-radius: 50%;\
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  font-size: 36px;\
  margin: 0 auto;\
  box-shadow: 0 0 32px rgba(0, 229, 255, 0.3);\
}\
.auth-user-stats {\
  margin-top: 20px;\
  background: var(--bg-tertiary);\
  border-radius: var(--radius-md);\
  padding: 4px 0;\
  overflow: hidden;\
}\
.auth-stat-row {\
  display: flex;\
  justify-content: space-between;\
  align-items: center;\
  padding: 10px 16px;\
  font-size: 13px;\
  color: var(--text-secondary);\
  border-bottom: 1px solid var(--border-color);\
}\
.auth-stat-row:last-child {\
  border-bottom: none;\
}\
.auth-stat-val {\
  font-weight: 700;\
  color: var(--accent-cyan);\
}\
@media (max-width: 480px) {\
  .auth-modal-card {\
    padding: 20px 18px;\
    margin: 0 8px;\
  }\
}\
    ';
    document.head.appendChild(style);
  }

  // ============ 初始化 ============

  function init() {
    // 初始化默认管理员账户
    var store = getAuthStore();
    if (!store.users || !Array.isArray(store.users)) {
      store.users = [];
    }
    var hasAdmin = store.users.some(function(u) {
      return u.username === 'admin' && u.role === 'admin';
    });
    if (!hasAdmin) {
      store.users.push({
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      setAuthStore(store);
    }

    // 如果有当前登录用户，设置数据前缀
    var curUser = store.currentUser;
    if (curUser) {
      setUserPrefix(curUser);
    }

    // 注入样式
    injectStyles();

    // 设置登录按钮
    var authBtn = AL.$('#authBtn');
    if (authBtn) {
      authBtn.addEventListener('click', function() {
        renderLoginUI();
      });
      updateAuthButton();
    }

    console.log('Auth module loaded. Current user:', curUser || '(none)');
  }

  // ============ 公开 API ============
  AL.Auth = {
    init: init,
    login: login,
    register: register,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isAdmin: isAdmin,
    getAllUsers: getAllUsers,
    getUserProgress: getUserProgress,
    renderLoginUI: renderLoginUI,
    renderAdminPanel: renderAdminPanel,
    updateAuthButton: updateAuthButton
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(AgentLearn);
