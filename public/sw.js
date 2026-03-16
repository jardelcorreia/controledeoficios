self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estratégia simples de fetch para cumprir requisitos de PWA
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});