// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
    authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
    projectId: "controle-de-ofcios-pd89y",
    storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
    messagingSenderId: "79560888151",
    appId: "1:79560888151:web:2a707a8a44c4cb4284f812"
});

const messaging = firebase.messaging(firebaseApp);


// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationData = payload.data;
  const notificationTitle = notificationData.title;
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || '/icons/icon-192x192.png',
    data: {
        link: notificationData.link
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);

  event.notification.close();

  const link = event.notification.data.link;

  if (link) {
     event.waitUntil(clients.openWindow(link));
  }
});
