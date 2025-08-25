// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "controle-de-ofcios-pd89y",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  messagingSenderId: "79560888151",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
