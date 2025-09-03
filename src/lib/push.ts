'use client';

import { savePushSubscription } from './oficios.actions';
import { getToken, type Messaging } from 'firebase/messaging';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Função para aguardar um tempo determinado
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para tentar reconectar com retry exponencial
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      
      if (attempt === maxRetries) {
        throw err;
      }

      // Verifica se é um erro que vale a pena tentar novamente
      const retryableErrors = [
        'push service error',
        'network error',
        'timeout',
        'connection failed',
        'service unavailable'
      ];
      
      const shouldRetry = retryableErrors.some(retryableError => 
        err.message.toLowerCase().includes(retryableError)
      );

      if (!shouldRetry) {
        throw err;
      }

      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Tentativa ${attempt} falhou. Tentando novamente em ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
  throw new Error('Máximo de tentativas excedido');
}

export async function initializePushNotifications(messaging: Messaging | null) {
  console.log('=== INICIANDO SETUP DE PUSH NOTIFICATIONS ===');
  console.log('Chave VAPID pública utilizada:', VAPID_PUBLIC_KEY);

  // Verificações preliminares
  if (typeof window === 'undefined') {
    throw new Error('Função deve ser executada no cliente');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker não é suportado neste navegador');
  }

  if (!('PushManager' in window)) {
    throw new Error('Push Messaging não é suportado neste navegador');
  }

  if (!messaging) {
    throw new Error('Firebase Messaging não inicializado');
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID_PUBLIC_KEY não encontrada nas variáveis de ambiente');
  }

  try {
    // 1. Aguardar o Service Worker estar totalmente carregado
    console.log('Aguardando Service Worker estar pronto...');
    await navigator.serviceWorker.ready;
    
    // 2. Pequeno delay para garantir estabilidade
    await delay(500);

    // 3. Solicitar permissão
    console.log('Solicitando permissão de notificação...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada pelo usuário');
    }
    
    console.log('Permissão de notificação concedida.');

    // 4. Obter token com retry
    console.log('Solicitando token FCM com retry...');
    
    const currentToken = await retryWithExponentialBackoff(async () => {
      return await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
      });
    });

    if (!currentToken) {
      throw new Error('Não foi possível obter o token FCM');
    }

    console.log('Token FCM recebido:', currentToken.substring(0, 20) + '...');

    // 5. Salvar no servidor
    console.log('Salvando token no servidor...');
    const result = await savePushSubscription({ token: currentToken });
    
    if (!result.success) {
      throw new Error(result.error || 'Falha ao salvar a inscrição no servidor');
    }

    console.log('🎉 Push notifications configurado com sucesso!');
    return currentToken;

  } catch (error: unknown) {
    const err = error as Error;
    
    // Log detalhado do erro
    console.error('❌ Erro detalhado:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    // Tratamento específico para diferentes tipos de erro
    if (err.name === 'AbortError' || err.message.includes('push service error')) {
      console.error('Push Service Error detectado - possível problema de conectividade ou configuração');
      throw new Error('Serviço de push temporariamente indisponível. Tente novamente em alguns minutos.');
    }

    if (err.message.includes('messaging/invalid-vapid-key')) {
      throw new Error('Chave VAPID inválida ou não configurada corretamente');
    }

    if (err.message.includes('messaging/permission-blocked')) {
      throw new Error('Permissões de notificação bloqueadas. Verifique as configurações do navegador.');
    }

    throw err;
  }
}

export async function debugPushSetup() {
  console.log('=== DEBUG PUSH SETUP DETALHADO ===');
  
  // Informações do navegador
  console.log('🌐 Informações do Navegador:');
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Service Worker suportado:', 'serviceWorker' in navigator);
  console.log('- Push Manager suportado:', 'PushManager' in window);
  console.log('- Notification permission:', Notification.permission);
  
  // Informações do protocolo
  console.log('🔒 Informações de Segurança:');
  console.log('- Protocolo:', location.protocol);
  console.log('- Hostname:', location.hostname);
  console.log('- É HTTPS:', location.protocol === 'https:');
  console.log('- É Localhost:', location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  
  // Informações de configuração
  console.log('⚙️ Configuração:');
  console.log('- VAPID key definida:', !!VAPID_PUBLIC_KEY);
  console.log('- Tamanho da VAPID key:', VAPID_PUBLIC_KEY?.length || 0);
  
  // Service Worker
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Service Worker:');
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        console.log('- Registration encontrado:', !!registration);
        console.log('- Scope:', registration.scope);
        console.log('- Estado ativo:', !!registration.active);
        console.log('- Estado installing:', !!registration.installing);
        console.log('- Estado waiting:', !!registration.waiting);
        
        if (registration.active) {
          console.log('- SW State:', registration.active.state);
        }
      } else {
        console.log('- Nenhum Service Worker registrado');
      }
      
      // Testar se consegue registrar um SW temporário
      console.log('📋 Testando capacidades do Push:');
      
      if ('PushManager' in window) {
        try {
          // Verificar se o Push é suportado
          const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
          console.log('- Push suportado:', pushSupported);
          
          if (pushSupported && registration) {
            try {
              // Tentar criar uma subscription temporária para teste
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: VAPID_PUBLIC_KEY
              });
              
              console.log('- Subscription de teste criada com sucesso');
              
              // Limpar a subscription de teste
              await subscription.unsubscribe();
              console.log('- Subscription de teste removida');
              
            } catch (subscribeError) {
              console.error('- Erro ao criar subscription de teste:', subscribeError);
            }
          }
        } catch (pushError) {
          console.error('- Erro ao testar Push Manager:', pushError);
        }
      }
      
    } catch (error: unknown) {
      console.error('❌ Erro no debug do Service Worker:', error);
    }
  }

  // Verificar conectividade com FCM
  console.log('🌍 Testando conectividade:');
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', { method: 'HEAD', mode: 'no-cors' });
    console.log('- Conectividade com FCM: OK');
  } catch (connectError) {
    console.log('- Conectividade com FCM: Erro', connectError);
  }
}

// Função auxiliar para resetar configurações de push
export async function resetPushConfiguration() {
  console.log('🔄 Resetando configuração de push...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          console.log('✅ Subscription anterior removida');
        }
      }
    }
    
    console.log('✅ Reset concluído');
  } catch (error) {
    console.error('❌ Erro durante reset:', error);
  }
}

// Função para verificar se as configurações estão corretas
export function validatePushConfiguration() {
  const issues: string[] = [];
  
  if (!VAPID_PUBLIC_KEY) {
    issues.push('VAPID_PUBLIC_KEY não definida');
  }
  
  if (VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length !== 88) {
    issues.push('VAPID_PUBLIC_KEY tem tamanho incorreto (deve ter 88 caracteres)');
  }
  
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('Push notifications requerem HTTPS ou localhost');
  }
  
  if (!('serviceWorker' in navigator)) {
    issues.push('Service Worker não suportado');
  }
  
  if (!('PushManager' in window)) {
    issues.push('Push Manager não suportado');
  }
  
  if (Notification.permission === 'denied') {
    issues.push('Permissões de notificação negadas');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}