
// Adiciona um listener para o evento 'install'.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalação iniciada.');
  // Acelera a ativação do Service Worker
  event.waitUntil(self.skipWaiting());
});

// Adiciona um listener para o evento 'activate'.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativação iniciada.');
  // Garante que o novo Service Worker controle a página imediatamente
  event.waitUntil(self.clients.claim());
});


// Importa os scripts do Firebase necessários (versão 'compat' para Service Workers).
try {
  importScripts(
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js'
  );
  console.log('Service Worker: Scripts do Firebase importados com sucesso.');
} catch (e) {
  console.error('Service Worker: Erro ao importar scripts do Firebase.', e);
}


// Acessa a configuração do Firebase passada como parâmetro na URL do script.
const urlParams = new URL(location).searchParams;
const firebaseConfig = JSON.parse(urlParams.get('firebaseConfig'));


// Verifica se a configuração foi recebida.
if (firebaseConfig) {
  console.log('Service Worker: Configuração do Firebase recebida.');
  // Inicializa o Firebase
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Service Worker: Firebase App inicializado.');

    const messaging = firebase.messaging();
    console.log('Service Worker: Firebase Messaging inicializado.');

    // O manipulador de background para mensagens push pode ser adicionado aqui se necessário.
    messaging.onBackgroundMessage((payload) => {
      console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
      );
      // Personalize a notificação aqui
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('Service Worker: Erro ao inicializar o Firebase.', e);
  }
} else {
  console.error('Service Worker: Configuração do Firebase não encontrada na URL.');
}
