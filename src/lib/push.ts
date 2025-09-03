
'use client';

import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';
import { app } from './firebase';
import { getMessaging } from 'firebase/messaging';

// Esta é a chave pública correta do seu projeto, gerada no Console do Firebase.
const VAPID_KEY = "BMOvZxaUXFm3yDnbYMxTKKfgkLC7ErYNVBHjGWPFHeGyCHq9b5mmCPPivky-KWClfOqVY6WPS9niSXdLD8rTjrQ";

export async function initializePushNotifications() {
  console.log("Iniciando processo de notificação push...");
  
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Push notifications não são suportadas neste navegador.');
  }

  const messagingInstance = getMessaging(app);

  try {
    console.log("Solicitando permissão de notificação...");
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada pelo usuário.');
    }
    console.log("Permissão concedida.");

    console.log("Tentando obter token FCM com VAPID Key:", VAPID_KEY);
    const currentToken = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
    });

    if (currentToken) {
      console.log('Token FCM obtido com sucesso:', currentToken);
      const result = await savePushSubscription(currentToken);
      if (!result.success) {
        throw new Error(result.error || 'Falha ao salvar o token de inscrição no servidor.');
      }
      console.log('Token salvo com sucesso no servidor.');
      return currentToken;
    } else {
      // Esta situação geralmente indica um problema de configuração ou do ambiente.
      console.error('Falha ao obter o token FCM. Nenhum token foi retornado.');
      throw new Error('Não foi possível obter o token de notificação. Verifique a configuração do Service Worker e do projeto Firebase.');
    }
  } catch (error: unknown) {
    console.error('❌ Erro detalhado no processo de push:', error);
    
    let errorMessage = "Ocorreu um erro desconhecido durante a configuração das notificações.";
    if (error instanceof Error) {
        // Personaliza a mensagem para o erro mais comum que estamos enfrentando
        if (error.name === 'AbortError' && error.message.includes('push service error')) {
            errorMessage = 'O serviço de push do navegador falhou. Isso pode ser um problema temporário com os servidores do Google ou uma restrição de rede no seu ambiente de desenvolvimento.';
        } else {
            errorMessage = error.message;
        }
    }
    
    // Lança um novo erro com a mensagem simplificada para ser exibida na UI
    throw new Error(errorMessage);
  }
}
