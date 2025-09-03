
'use client';

import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';

export async function initializePushNotifications(messaging: Messaging | null) {
  try {
    if (typeof window === 'undefined' || !messaging) {
      throw new Error('Firebase Messaging is not available.');
    }

    const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
     if (!VAPID_KEY) {
      throw new Error("VAPID key não encontrada nas variáveis de ambiente.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    
    console.log("Solicitando token FCM...");
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    
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
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('push service error'))) {
      throw new Error('Serviço de push temporariamente indisponível. Tente novamente em alguns minutos.');
    }
    throw error;
  }
}
