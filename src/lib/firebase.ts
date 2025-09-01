// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import webpush from "web-push";

const firebaseConfig = {
  projectId: "controle-de-ofcios-pd89y",
  appId: "1:79560888151:web:2a707a8a44c4cb4284f812",
  storageBucket: "controle-de-ofcios-pd89y.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "controle-de-ofcios-pd89y.firebaseapp.com",
  messagingSenderId: "79560888151",
};

// Singleton to store VAPID keys
const vapidKeysSingleton = (() => {
  let instance: { publicKey: string; privateKey: string; };

  function createInstance() {
    console.log("Generating new VAPID keys...");
    const keys = webpush.generateVAPIDKeys();
    return keys;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

const getVapidKeys = () => {
    return vapidKeysSingleton.getInstance();
}

export { app, db, getVapidKeys };
