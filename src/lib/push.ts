
'use client';

import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';

export async function initializePushNotifications(messaging: Messaging | null) {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !messaging) {
      throw new Error('Firebase Messaging não é suportado neste navegador.');
    }

    const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_KEY) {
      throw new Error("VAPID key não encontrada. Verifique as variáveis de ambiente.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }

    // Tenta registrar o service worker.
    // O service worker já deve estar na pasta /public
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registrado com sucesso, escopo:', registration.scope);

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
  } catch (error: unknown) {
    console.error('❌ Erro ao configurar push notifications:', error);

    if (error instanceof Error) {
        if (error.message.includes('ServiceWorker script evaluation failed')) {
            throw new Error('Falha ao executar o script do Service Worker. Verifique o console do Service Worker para mais detalhes.');
        }
        if (error.name === 'AbortError' || error.message.includes('push service error')) {
            throw new Error('O serviço de push do navegador falhou. Isso pode ser um problema temporário com os servidores do Google ou um problema de configuração do projeto.');
        }
    }
    throw error;
  }
}
