// Import and initialize the Firebase SDK
// This is a minimal implementation of a service worker for Firebase Cloud Messaging.
// It is required to be in the public directory and named firebase-messaging-sw.js

// Scripts for Firebase v9+
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// by passing in the messagingSenderId.
// This is the same config from your web app's Firebase configuration.
const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  messagingSenderId: "79560888151",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
