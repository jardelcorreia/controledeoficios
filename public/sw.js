
self.addEventListener('push', function(event) {
  const body = event.data?.text() ?? 'Nova notificação';
  event.waitUntil(
    self.registration.showNotification('Controle de Ofícios', {
      body: body,
      icon: '/icon-192x192.png'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
