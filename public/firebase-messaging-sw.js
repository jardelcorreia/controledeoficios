// Import the Firebase app and messaging libraries
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: self.location.search.split('apiKey=')[1],
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  messagingSenderId: "79560888151",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// The service worker can be kept simple. 
// The SDK will handle the rest.
console.log('Firebase Messaging Service Worker initialized.');
