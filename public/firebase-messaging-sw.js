
// /public/firebase-messaging-sw.js

// Importa os scripts do Firebase SDK. A versão deve ser compatível com a do seu app.
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// Extrai os parâmetros de configuração da URL do script.
const urlParams = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
  measurementId: urlParams.get('measurementId'),
};

// Verifica se a configuração foi passada corretamente
if (firebaseConfig.apiKey) {
  // Inicializa o app Firebase no Service Worker
  firebase.initializeApp(firebaseConfig);

  // Recupera uma instância do Firebase Messaging para lidar com mensagens em segundo plano.
  const messaging = firebase.messaging();

  // Adiciona um handler para quando uma mensagem é recebida em segundo plano.
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Personalize a notificação aqui.
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/icons/icon-192x192.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log('[firebase-messaging-sw.js] Firebase Messaging Service Worker setup complete.');

} else {
    console.error('[firebase-messaging-sw.js] Firebase config not found in URL search params.');
}
