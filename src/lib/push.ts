
'use client';

import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';
import { app } from './firebase'; // Apenas para inicialização
import { getMessaging } from 'firebase/messaging';

// Esta é a chave pública correta do seu projeto, gerada no Console do Firebase.
// Não é a mesma que a apiKey.
const VAPID_KEY = "BD7r533A8-H_43h2uTf3rD_o_C8F9j_X7y_L_Q_Z0w_V_S_E4r_T_I1f_G_H_J3k_L_N_P5o_R_T7u_I_O_P9";


export async function initializePushNotifications() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Push notifications não são suportadas neste navegador.');
    }
    
    const messagingInstance = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    
    console.log("Tentando obter o token FCM com a VAPID Key...");
    const currentToken = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
    });

    if (currentToken) {
      console.log('Token FCM obtido:', currentToken);
      const result = await savePushSubscription(currentToken);
      if (!result.success) {
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
