
// Service Worker (sw.js)

self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Recebido");
  if (!event.data) {
    console.error("Service Worker: Push event sem dados");
    return;
  }

  const data = event.data.json();
  const { notification } = data; // A estrutura do payload é { notification: { title, body, ... } }

  if (!notification) {
      console.error("Service Worker: Objeto 'notification' não encontrado no payload do push");
      return;
  }

  const title = notification.title || "Nova Notificação";
  const options = {
    body: notification.body || "",
    icon: notification.icon || "/icons/icon-192x192.png",
    badge: notification.badge || "/icons/icon-96x96.png",
    data: notification.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notificação clicada");
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Verifica se o cliente já está aberto
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova aba
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

