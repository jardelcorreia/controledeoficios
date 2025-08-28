// public/sw.js

// Este Service Worker é o primeiro passo para habilitar notificações push.
// Ele será registrado pelo navegador quando o usuário der permissão.

// Por enquanto, ele está simples. A lógica para receber e exibir
// as notificações do servidor (via Firebase Cloud Messaging, por exemplo)
// será adicionada em uma etapa futura.

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado.');
});

// Este é um listener de exemplo. A implementação real dependerá de como
// o servidor envia os dados da notificação.
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  const data = event.data ? event.data.json() : { title: 'Novo Ofício', body: 'Um novo ofício foi criado ou atualizado.', icon: '/icon-192x192.png' };

  const title = data.title;
  const options = {
    body: data.body,
    icon: data.icon,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

    