// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "controle-de-ofcios-pd89y",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  messagingSenderId: "79560888151",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;


export { app, db, VAPID_PUBLIC_KEY };
