
'use client';

import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';
import { firebaseConfig } from './firebase';

export async function initializePushNotifications(messaging: Messaging | null) {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !messaging) {
      throw new Error('Firebase Messaging não é suportado neste navegador.');
    }

    const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_KEY) {
      throw new Error("VAPID key não encontrada nas variáveis de ambiente.");
    }
    
    // Constrói a URL do Service Worker com os parâmetros de configuração
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey!)}&authDomain=${encodeURIComponent(firebaseConfig.authDomain!)}&projectId=${encodeURIComponent(firebaseConfig.projectId!)}&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket!)}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId!)}&appId=${encodeURIComponent(firebaseConfig.appId!)}&measurementId=${encodeURIComponent(firebaseConfig.measurementId!)}`;

    // Registra o Service Worker. O navegador vai buscar e executar este script.
    const registration = await navigator.serviceWorker.register(swUrl);
    
    console.log('Service Worker registrado com sucesso, escopo:', registration.scope);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    
    console.log("Solicitando token FCM...");
    const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
    });
    
    if (currentToken) {
      console.log('Token FCM obtido com sucesso:', currentToken);
      await savePushSubscription({ token: currentToken });
      console.log('Push notifications configuradas com sucesso!');
      return currentToken;
    } else {
      throw new Error('Não foi possível obter o token FCM. A permissão foi concedida?');
    }
  } catch (error) {
    console.error('❌ Erro ao configurar push notifications:', error);
    if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('push service error')) {
            throw new Error('O serviço de push do navegador falhou. Isso pode ser um problema temporário com os servidores do Google ou um problema de configuração do projeto.');
        }
        if (error.message.includes('ServiceWorker script evaluation failed')) {
            throw new Error('Falha ao executar o script do Service Worker. Verifique o console do Service Worker para mais detalhes.');
        }
    }
    throw error;
  }
}
