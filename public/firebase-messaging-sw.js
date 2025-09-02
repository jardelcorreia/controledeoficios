
// Import and initialize the Firebase SDK
// This is done in the main service worker, not here.
// However, if you're using Firebase Messaging specifically,
// you'd initialize it here. For web-push, this is simpler.

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  
  if (!event.data) {
    console.error("[Service Worker] Push event but no data");
    return;
  }

  const pushData = event.data.json();
  console.log("[Service Worker] Push data:", pushData);

  const { title, body, icon, data } = pushData.notification;

  const options = {
    body: body,
    icon: icon,
    badge: "/icons/icon-96x96.png", // A smaller badge icon
    vibrate: [200, 100, 200],
    data: {
        url: data.url, // Pass the URL to the notification
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window open with the same URL.
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
