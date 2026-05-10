/**
 * Service Worker — AI Agent 学习平台
 * 离线缓存 + 安装支持
 */
const CACHE_NAME = 'agent-learn-v2';
const ASSETS = [
  '/agent-learning/',
  '/agent-learning/index.html',
  '/agent-learning/css/global.css',
  '/agent-learning/css/components.css',
  '/agent-learning/js/core.js',
  '/agent-learning/js/theme.js',
  '/agent-learning/js/progress-tracker.js',
  '/agent-learning/js/quiz-engine.js',
  '/agent-learning/js/search.js',
  '/agent-learning/js/agent-simulator.js',
  '/agent-learning/js/notes-system.js',
  '/agent-learning/js/navigation.js',
  '/agent-learning/js/achievements.js',
  '/agent-learning/js/learning-path.js',
  '/agent-learning/js/bookmarks.js',
  '/agent-learning/js/components.js',
  '/agent-learning/manifest.json',
  '/agent-learning/data/chapters.json',
  '/agent-learning/data/quizzes.json'
];

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first strategy
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});