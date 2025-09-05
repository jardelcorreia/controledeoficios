
"use client";

import { useEffect } from 'react';
import { initializePushNotifications } from '@/lib/push';
import { useToast } from '@/hooks/use-toast';

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  useEffect(() => {
    const requestPermission = async () => {
      try {
        // Verifica se a permissão já foi solicitada antes
        const existingPermission = Notification.permission;
        if (existingPermission === 'default') {
            const permission = await initializePushNotifications();
            if (permission === 'granted') {
                toast({
                    title: 'Notificações Ativadas!',
                    description: 'Você receberá atualizações importantes.',
                });
            }
        }
      } catch (error) {
        console.error('Erro ao inicializar notificações push:', error);
         if (error instanceof Error && error.message.includes('permission denied')) {
            // Não mostra o toast se o usuário apenas fechou o pop-up
         } else {
            toast({
              title: 'Erro de Notificação',
              description: 'Não foi possível ativar as notificações.',
              variant: 'destructive',
            });
         }
      }
    };

    // Atraso para não sobrecarregar o carregamento inicial
    const timer = setTimeout(() => {
        requestPermission();
    }, 2000); 

    return () => clearTimeout(timer);
  }, [toast]);

  return <>{children}</>;
};

export default NotificationProvider;
