
// Use a modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-sw.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.appspot.com",
  messagingSenderId: "367123996587",
  appId: "1:367123996587:web:8d29b2d861c8f1e29c1184",
  measurementId: "G-9S2119M0S0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
