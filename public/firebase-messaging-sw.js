
// Este script será executado em segundo plano.

// Importa os scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// A configuração do Firebase será passada via search params do script.
// Ex: /firebase-messaging-sw.js?apiKey=...&authDomain=...
const searchParams = new URL(location).searchParams;

const firebaseConfig = {
  apiKey: searchParams.get('apiKey'),
  authDomain: searchParams.get('authDomain'),
  projectId: searchParams.get('projectId'),
  storageBucket: searchParams.get('storageBucket'),
  messagingSenderId: searchParams.get('messagingSenderId'),
  appId: searchParams.get('appId'),
  measurementId: searchParams.get('measurementId'),
};

// Inicializa o Firebase
if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);

    // Obtém uma instância do Firebase Messaging
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
      );
    
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error("Configuração do Firebase não encontrada no Service Worker. Não foi possível inicializar.");
}
