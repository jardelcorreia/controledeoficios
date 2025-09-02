// Import and configure the Firebase SDK
// This is required for the service worker to handle messages.
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "controle-de-ofcios-pd89y",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  apiKey: self.location.search.split('apiKey=')[1].split('&')[0],
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  messagingSenderId: "79560888151",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// The service worker is intentionally left blank after this.
// Firebase SDK handles the rest.
// You can add custom logic here for handling background notifications if needed.
// For example: onBackgroundMessage(messaging, (payload) => { ... });
