
// Adiciona um ouvinte de evento para o evento 'push'.
// Este evento é acionado sempre que uma notificação push é recebida do servidor.
self.addEventListener('push', function (event) {
  // Extrai os dados da notificação do objeto de evento.
  // Se não houver dados, usa um objeto de notificação padrão.
  const data = event.data?.json() ?? {
    notification: {
      title: 'Notificação Padrão',
      body: 'Algo novo aconteceu!',
      icon: '/icons/icon-192x192.png',
      data: {
        url: '/',
      },
    },
  };

  const { title, body, icon, data: notificationData } = data.notification;

  // Usa o método showNotification() do service worker para exibir a notificação.
  // Isso cria uma notificação visível para o usuário.
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: notificationData, // Armazena dados extras na notificação
    })
  );
});

// Adiciona um ouvinte de evento para o evento 'notificationclick'.
// Este evento é acionado quando o usuário clica em uma notificação.
self.addEventListener('notificationclick', function (event) {
  // Fecha a notificação que foi clicada.
  event.notification.close();

  // Obtém a URL dos dados da notificação.
  const urlToOpen = event.notification.data?.url || '/';

  // Usa event.waitUntil para garantir que o service worker não termine
  // antes que a nova janela/aba seja aberta.
  event.waitUntil(
    // Procura por uma janela/aba do cliente que já esteja aberta e visível.
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function (clientList) {
      // Se uma janela correspondente for encontrada e for visível, foca nela.
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se nenhuma janela correspondente for encontrada, abre uma nova aba/janela.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
