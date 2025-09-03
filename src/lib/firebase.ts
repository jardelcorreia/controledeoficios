// @/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

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

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = (app: FirebaseApp) =>
  typeof window !== "undefined" ? getMessaging(app) : null;


export { app, db, messaging };
