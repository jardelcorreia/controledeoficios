self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
  // O Service Worker é obrigatório para a instalabilidade PWA.
  // Neste caso, ele apenas repassa as requisições para a rede.
  event.respondWith(fetch(event.request));
});
