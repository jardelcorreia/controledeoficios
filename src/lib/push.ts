
'use client';

import { getToken } from 'firebase/messaging';
import { savePushSubscription, deletePushSubscription } from './oficios.actions';
import { app } from './firebase';
import { getMessaging } from 'firebase/messaging';

const VAPID_KEY = "BMOvZxaUXFm3yDnbYMxTKKfgkLC7ErYNVBHjGWPFHeGyCHq9b5mmCPPivky-KWClfOqVY6WPS9niSXdLD8rTjrQ";

async function getServiceWorkerRegistration() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }
    return navigator.serviceWorker.ready;
}


export async function initializePushNotifications() {
  console.log("Iniciando processo de notificação push...");
  
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
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
      console.error('Falha ao obter o token FCM. Nenhum token foi retornado.');
      throw new Error('Não foi possível obter o token de notificação. Verifique a configuração do Service Worker e do projeto Firebase.');
    }
  } catch (error: unknown) {
    console.error('❌ Erro detalhado no processo de push:', error);
    
    let errorMessage = "Ocorreu um erro desconhecido durante a configuração das notificações.";
    if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('push service error')) {
            errorMessage = 'O serviço de push do navegador falhou. Isso pode ser um problema temporário com os servidores do Google ou uma restrição de rede no seu ambiente de desenvolvimento.';
        } else {
            errorMessage = error.message;
        }
    }
    
    throw new Error(errorMessage);
  }
}

export async function isSubscribed(): Promise<boolean> {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
}

export async function unsubscribeFromPush() {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
        throw new Error("Service Worker não está disponível.");
    }
    
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
        console.log("Nenhuma subscrição encontrada para cancelar.");
        return;
    }

    // A maneira mais confiável de obter o token para deletar é pegá-lo novamente
    const messagingInstance = getMessaging(app);
    const token = await getToken(messagingInstance, { vapidKey: VAPID_KEY });
    
    const unsubscribed = await subscription.unsubscribe();
    if (!unsubscribed) {
        throw new Error("Falha ao cancelar a subscrição no navegador.");
    }
    
    console.log("Subscrição cancelada com sucesso no navegador.");
    
    if (token) {
        await deletePushSubscription(token);
        console.log("Token removido do servidor.");
    } else {
        console.warn("Não foi possível obter o token para remover do servidor, mas a desinscrição no navegador foi bem-sucedida.");
    }
}
