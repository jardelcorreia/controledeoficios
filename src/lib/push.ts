
'use client'

import { savePushSubscription } from "./oficios.actions";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";

// Esta deve ser a MESMA chave que você está usando no backend
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;


export async function initializePushNotifications() {
  console.log('=== INICIANDO SETUP DE PUSH NOTIFICATIONS ===');
  
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.error('Service Worker ou Push Messaging não é suportado neste navegador');
    throw new Error('Push Notifications não são suportadas.');
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY não encontrada nas variáveis de ambiente');
    throw new Error('VAPID key não configurada');
  }

  try {
     const swPath = '/firebase-messaging-sw.js';
     const registration = await navigator.serviceWorker.register(swPath);
     console.log('Service Worker registrado:', registration);
    
    await navigator.serviceWorker.ready;
    console.log('Service Worker pronto.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }
    console.log('Permissão de notificação concedida.');

    const messaging = getMessaging(app);
    console.log('Solicitando token FCM...');
    
    const currentToken = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
    });

    if (currentToken) {
        console.log('Token FCM recebido:', currentToken);
        console.log('Salvando token no servidor...');
        
        await savePushSubscription({ token: currentToken });
        
        console.log('🎉 Push notifications configurado com sucesso!');
        return currentToken;
    } else {
        console.warn('Não foi possível obter o token. O usuário precisa conceder permissão.');
        throw new Error('Falha ao obter o token de notificação.');
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Erro ao configurar push notifications:', err);
    throw err;
  }
}

// Função para testar se as notificações estão funcionando
export async function testNotification() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error('Service Worker não registrado');
    }

    await registration.showNotification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200]
    });

    console.log('✅ Notificação de teste enviada');
  } catch (error: unknown) {
    console.error('❌ Erro ao enviar notificação de teste:', error);
    throw error;
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
      if(registration){
        console.log('SW Scope:', registration.scope);
      }

    } catch (error: unknown) {
      console.error('Erro no debug:', error);
    }
  }
}
