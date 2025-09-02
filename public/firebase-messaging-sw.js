// Import a modular SDK
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU", // A chave precisa estar aqui diretamente.
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  messagingSenderId: "79560888151",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  if (!payload.notification) {
    return;
  }
  
  const notificationTitle = payload.notification.title || "Novo Ofício";
  const notificationOptions = {
    body: payload.notification.body || "Um novo ofício foi adicionado.",
    icon: payload.notification.icon || "/icons/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
