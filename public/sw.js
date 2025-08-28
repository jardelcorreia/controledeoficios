
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "Controle de Ofícios",
    body: "Você tem uma nova notificação.",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192x192.png", // Ícone para a notificação
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/") // Abre a página principal ao clicar na notificação
  );
});
