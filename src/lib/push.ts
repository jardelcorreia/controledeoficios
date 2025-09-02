
'use client'

import { savePushSubscription } from "./oficios.actions";

// Esta deve ser a MESMA chave que você está usando no backend
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initializePushNotifications() {
  console.log('=== INICIANDO SETUP DE PUSH NOTIFICATIONS ===');
  
  // Verificações básicas
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker não é suportado neste navegador');
    throw new Error('Service Worker não suportado');
  }

  if (!('PushManager' in window)) {
    console.error('Push messaging não é suportado neste navegador');
    throw new Error('Push messaging não suportado');
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY não encontrada nas variáveis de ambiente');
    throw new Error('VAPID key não configurada');
  }

  console.log('✅ Verificações básicas passou');
  console.log('VAPID Public Key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');

  try {
    // 1. Registrar o Service Worker
    console.log('📝 Registrando Service Worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registrado:', registration);

    // 2. Aguardar o Service Worker estar pronto
    console.log('⏳ Aguardando Service Worker estar pronto...');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto');

    // 3. Verificar permissão de notificação
    console.log('🔔 Verificando permissão de notificação...');
    let permission = Notification.permission;
    
    if (permission === 'default') {
      console.log('📋 Solicitando permissão de notificação...');
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.error('❌ Permissão de notificação negada:', permission);
      throw new Error('Permissão de notificação negada');
    }

    console.log('✅ Permissão de notificação concedida');

    // 4. Verificar se já existe uma subscrição
    console.log('🔍 Verificando subscrição existente...');
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ Subscrição existente encontrada:', subscription);
      return subscription;
    }

    // 5. Criar nova subscrição
    console.log('🆕 Criando nova subscrição...');
    
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('✅ Nova subscrição criada:', subscription);

    // 6. Salvar subscrição no servidor via Server Action
    console.log('💾 Salvando subscrição no servidor...');
    const result = await savePushSubscription(subscription);

    if (!result.success) {
      throw new Error(result.error || 'Falha ao salvar a inscrição no servidor.');
    }

    console.log('✅ Subscrição salva no servidor');
    console.log('🎉 Push notifications configurado com sucesso!');

    return subscription;

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Erro ao configurar push notifications:', err);
    
    // Logging detalhado do erro
    if (err.name === 'NotSupportedError') {
      console.error('Push messaging não é suportado neste dispositivo/navegador');
    } else if (err.name === 'NotAllowedError') {
      console.error('Usuário negou a permissão de notificação');
    } else if (err.name === 'AbortError') {
      console.error('Operação foi abortada - Push Service Error');
    } else {
      console.error('Erro detalhado:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    throw error;
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

// Função para debugar problemas
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
      
      if (registration?.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        console.log('Subscription existente:', subscription);
        
        if (subscription) {
          console.log('Endpoint:', subscription.endpoint);
          console.log('Keys:', subscription.keys);
        }
      }
    } catch (error: unknown) {
      console.error('Erro no debug:', error);
    }
  }
}
