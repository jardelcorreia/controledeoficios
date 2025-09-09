// Import the Firebase SDK for Messaging.
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  messagingSenderId: "79560888151",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification?.title || "Novo Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Você tem uma nova mensagem.",
    icon: payload.notification?.icon || "/icons/icon-192x192.png",
    // Use a 'tag' para agrupar as notificações. 
    // Notificações com a mesma tag se substituem, evitando duplicatas.
    tag: "oficio-notification-tag", 
    data: {
      url: payload.fcmOptions?.link || "/",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Adiciona um listener para o evento 'notificationclick'
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click Received.", event.notification);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Se uma janela com a mesma URL já estiver aberta, foque nela.
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Se não, abra uma nova janela.
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
