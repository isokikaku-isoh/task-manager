// Service Worker for Task Manager PWA
const CACHE_NAME = 'task-manager-v1';
const CACHE_URLS = [
  './',
  './index.html'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ時にキャッシュを優先（ネットワークフォールバック）
self.addEventListener('fetch', event => {
  // GASのAPIリクエストはスキップ
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('macros/s/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // キャッシュがあれば即座に返し、バックグラウンドで更新
        if (cached) {
          // バックグラウンドでネットワークから取得して更新
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, response));
              }
            })
            .catch(() => {});
          return cached;
        }
        
        // キャッシュがなければネットワークから取得
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          });
      })
  );
});
