
'use client';

import { savePushSubscription } from './oficios.actions';
import { getToken, type Messaging } from 'firebase/messaging';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export async function initializePushNotifications(messaging: Messaging | null) {
  console.log('=== INICIANDO SETUP DE PUSH NOTIFICATIONS ===');
  console.log('Chave VAPID pública utilizada:', VAPID_PUBLIC_KEY);


  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Service Worker ou Push Messaging não é suportado neste navegador');
    throw new Error('Push Notifications não são suportadas.');
  }

  if (!messaging) {
      console.error('Firebase Messaging não inicializado.');
      throw new Error('Firebase Messaging não inicializado.');
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY não encontrada nas variáveis de ambiente');
    throw new Error('VAPID key não configurada');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    console.log('Permissão de notificação concedida.');
    
    // Tenta obter o token
    console.log('Solicitando token FCM...');
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
    });

    if (currentToken) {
      console.log('Token FCM recebido:', currentToken);
      console.log('Salvando token no servidor...');

      const result = await savePushSubscription({ token: currentToken });
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao salvar a inscrição no servidor.');
      }

      console.log('🎉 Push notifications configurado com sucesso!');
      return currentToken;
    } else {
      console.warn('Não foi possível obter o token. O usuário precisa conceder permissão novamente.');
      throw new Error('Falha ao obter o token de notificação.');
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Erro ao configurar push notifications:', err.message, err);

    if (err.name === 'AbortError' || err.message.includes('push service error')) {
       console.error('Operação foi abortada - Push Service Error');
       throw new Error('Operação foi abortada - Push Service Error');
    }
    
    throw err;
  }
}


export async function debugPushSetup() {
  console.log('=== DEBUG PUSH SETUP ===');
  console.log('Service Worker suportado:', 'serviceWorker' in navigator);
  console.log('Push Manager suportado:', 'PushManager' in window);
  console.log('Notification permission:', Notification.permission);
  console.log('VAPID key definida:', !!VAPID_PUBLIC_KEY);
  console.log('User Agent:', navigator.userAgent);
  console.log('HTTPS:', location.protocol === 'https:');
  console.log('Localhost:', location.hostname === 'localhost');

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('SW Registration:', registration);
      if (registration) {
        console.log('SW Scope:', registration.scope);
        console.log('SW Ativo:', !!registration.active);
      }
    } catch (error: unknown) {
      console.error('Erro no debug:', error);
    }
  }
}
