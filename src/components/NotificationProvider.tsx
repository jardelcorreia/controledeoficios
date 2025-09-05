
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const messagingInstance = getMessaging(app);

        const unsubscribe = onMessage(messagingInstance, (payload) => {
            console.log('Foreground message received.', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });

        return () => {
            unsubscribe();
        };
    }
  }, [toast]);

  return <>{children}</>;
};

export default NotificationProvider;
