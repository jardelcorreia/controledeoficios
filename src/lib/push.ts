
'use client';

import type { Messaging } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { savePushSubscription } from './oficios.actions';

export async function initializePushNotifications(messaging: Messaging | null) {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !messaging) {
      throw new Error('Firebase Messaging não é suportado neste navegador.');
    }

    // 1. Pedir permissão
    console.log("Passo 1: Solicitando permissão de notificação...");
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    console.log("Permissão concedida.");

    // 2. Garantir que o Service Worker está pronto
    console.log("Passo 2: Aguardando Service Worker estar pronto...");
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker está pronto e ativo.");
    
    const VAPID_KEY = "BMOvZxaUXFm3yDnbYMxTKKfgkLC7ErYNVBHjGWPFHeGyCHq9b5mmCPPivky-KWClfOqVY6WPS9niSXdLD8rTjrQ";
    console.log(`Passo 3: Solicitando token com a VAPID key: ${VAPID_KEY}`);

    // 3. Obter o token
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log('Passo 4: Token FCM obtido com sucesso:', currentToken);
      await savePushSubscription({ token: currentToken });
      console.log('Notificações push configuradas com sucesso!');
      return currentToken;
    } else {
      // Esta condição geralmente indica que o `getToken` falhou silenciosamente
      throw new Error('Não foi possível obter o token FCM. A permissão foi concedida, mas o registro falhou.');
    }
  } catch (error: unknown) {
    console.error('❌ Erro final na configuração do push:', error);

    let errorMessage = "Ocorreu um erro desconhecido.";
    if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('push service error')) {
            errorMessage = 'O serviço de push do navegador falhou. Isso pode ser um problema temporário com os servidores do Google ou um problema de configuração do projeto.';
        } else if (error.message.includes('ServiceWorker script evaluation failed')) {
            errorMessage = 'Falha ao executar o script do Service Worker. Verifique o console do Service Worker para mais detalhes.';
        } else {
            errorMessage = error.message;
        }
    }
    
    // Lança um erro claro para ser pego pela UI
    throw new Error(errorMessage);
  }
}
