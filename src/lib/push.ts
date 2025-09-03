
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

export async function debugPushSetup() {
  if (typeof window === 'undefined') return;

  console.log('%c=== DEBUG PUSH SETUP DETALHADO ===', 'color: blue; font-weight: bold;');

  const logInfo = (label: string, value: any) => console.log(`- ${label}:`, value);

  console.log('%c🌐 Informações do Navegador:', 'font-weight: bold;');
  logInfo('User Agent', navigator.userAgent);
  logInfo('Service Worker suportado', 'serviceWorker' in navigator);
  logInfo('Push Manager suportado', 'PushManager' in window);
  logInfo('Notification permission', Notification.permission);
  
  console.log('%c🔒 Informações de Segurança:', 'font-weight: bold;');
  logInfo('Protocolo', window.location.protocol);
  logInfo('Hostname', window.location.hostname);
  logInfo('É HTTPS', window.location.protocol === 'https:');
  logInfo('É Localhost', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  console.log('%c⚙️ Configuração:', 'font-weight: bold;');
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  logInfo('VAPID key definida', !!vapidKey);
  if (vapidKey) {
    logInfo('Tamanho da VAPID key', vapidKey.length);
  }

  console.log('%c🔧 Service Worker:', 'font-weight: bold;');
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        logInfo('Registration encontrado', true);
        logInfo('Scope', registration.scope);
        logInfo('Estado ativo', !!registration.active);
        logInfo('Estado installing', !!registration.installing);
        logInfo('Estado waiting', !!registration.waiting);
        if (registration.active) {
            logInfo('SW State', registration.active.state);
        }
      } else {
        logInfo('Registration encontrado', false);
      }
    } catch (e) {
      console.error('- Erro ao obter registro do SW:', e);
    }
  }

  console.log('%c📋 Testando capacidades do Push:', 'font-weight: bold;');
  if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
          const swReg = await navigator.serviceWorker.ready;
          logInfo('Push suportado', !!swReg.pushManager);
      } catch (e) {
          console.error('- Erro ao verificar suporte a Push:', e);
      }
  }

  console.log('%c🌍 Testando conectividade:', 'font-weight: bold;');
  try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: { 'Content-Length': '0' },
      }).catch(() => {});
      logInfo('Conectividade com FCM', 'OK');
  } catch (e: any) {
      if (e.name === 'TypeError') {
           logInfo('Conectividade com FCM', 'OK (CORS block esperado)');
      } else {
          console.error('- Erro ao testar conectividade com FCM:', e);
      }
  }
}
