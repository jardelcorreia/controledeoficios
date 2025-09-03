
// /public/firebase-messaging-sw.js

// Importa os scripts do Firebase SDK usando o método correto para Service Workers
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js");

// As credenciais do seu projeto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.appspot.com",
  messagingSenderId: "313933939634",
  appId: "1:313933939634:web:0b7405e6080e7784013480",
  measurementId: "G-9QKVDB3B2B"
};

// Inicializa o app Firebase no Service Worker
firebase.initializeApp(firebaseConfig);

// Obtém uma instância do Firebase Messaging
const messaging = firebase.messaging();

// Opcional: Adiciona um manipulador de background para quando a notificação
// é recebida enquanto o app está em segundo plano.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
