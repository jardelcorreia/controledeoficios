
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, onMessage, MessagePayload } from 'firebase/messaging';
import { app } from '@/lib/firebase';

const processedMessageIds = new Set<string>();

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  useEffect(() => {
    // Garante que o código só é executado no browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    console.log('🔥 Configurando Firebase listener');
    
    const messagingInstance = getMessaging(app);

    const unsubscribe = onMessage(messagingInstance, (payload: MessagePayload) => {
        const messageId = payload.messageId;

        // Lógica de deduplicação sugerida
        if (messageId && processedMessageIds.has(messageId)) {
            console.log('⚠️ DUPLICATA DETECTADA E IGNORADA:', messageId);
            return; 
        }

        if (messageId) {
            processedMessageIds.add(messageId);
        }

        console.log('✅ Mensagem em primeiro plano recebida e processada:', payload);
        
        // As notificações em primeiro plano agora vêm no campo `data`
        const notification = payload.data || payload.notification;

        if (notification?.title && notification?.body) {
            toast({
                title: notification.title,
                description: notification.body,
            });
        }
    });

    return () => {
        console.log('🧹 Removendo listener');
        unsubscribe();
    };
  // O array de dependências vazio garante que este efeito execute apenas uma vez.
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
