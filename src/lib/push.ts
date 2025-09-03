
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

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: firebaseConfig.apiKey,
    });

    if (currentToken) {
      console.log('Token FCM obtido:', currentToken);
      const result = await savePushSubscription(currentToken);
      if (!result.success) {
        // Se o salvamento no servidor falhar, lança o erro para a UI.
        throw new Error(result.error || 'Falha ao salvar o token no servidor.');
      }
      console.log('Token salvo com sucesso!');
      return currentToken;
    } else {
      throw new Error('Não foi possível obter o token FCM. A permissão foi concedida, mas o registro falhou.');
    }
  } catch (error) {
    console.error('❌ Erro ao configurar push notifications:', error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    throw new Error(errorMessage);
  }
}
