
// @/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";

// Your web app's Firebase configuration
// This object is provided by the Firebase console.
export const firebaseConfig = {
  apiKey: "AIzaSyAwwgWBTAwaEISWj4zYh6sPi0ufixevHnU",
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  projectId: "controle-de-ofcios-pd89y",
  storageBucket: "controle-de-ofcios-pd89y.appspot.com",
  messagingSenderId: "79560888151",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

const messaging = (appInstance: FirebaseApp): Messaging | null =>
  typeof window !== 'undefined' ? getMessaging(appInstance) : null;


export { app, db, messaging };
