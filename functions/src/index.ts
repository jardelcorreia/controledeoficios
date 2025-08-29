/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as webpush from "web-push";

// Inicializa o Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// Configura as chaves VAPID (devem ser configuradas como variáveis de ambiente)
// firebase functions:config:set vapid.public_key="YOUR_PUBLIC_KEY"
// firebase functions:config:set vapid.private_key="YOUR_PRIVATE_KEY"
const vapidConfig = functions.config().vapid;

if (vapidConfig && vapidConfig.public_key && vapidConfig.private_key) {
  webpush.setVapidDetails(
    "mailto:jardel.lc@gmail.com",
    vapidConfig.public_key,
    vapidConfig.private_key
  );
} else {
  functions.logger.warn(
    "VAPID keys not configured. Push notifications will be disabled."
  );
}

/**
 * Função acionada na criação ou atualização de um ofício.
 * Envia notificações push para os usuários inscritos.
 */
export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    // Verifica se as chaves VAPID estão configuradas antes de prosseguir
    if (!vapidConfig || !vapidConfig.public_key || !vapidConfig.private_key) {
      functions.logger.error(
        "VAPID keys are not set. Cannot send notification."
      );
      return null;
    }

    const oficioId = context.params.oficioId;
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();

    let notificationPayload = null;

    // Caso 1: Novo ofício criado
    if (!change.before.exists && change.after.exists && dataAfter) {
      functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
      notificationPayload = {
        notification: {
          title: "Novo Ofício Criado!",
          body: `O ofício nº ${dataAfter.numero} foi criado e está aguardando envio.`,
          icon: "/icons/icon-192x192.png",
          data: {
            url: `/oficios/${oficioId}`,
          },
        },
      };
    }
    // Caso 2: Ofício atualizado para "Enviado"
    else if (
      change.before.exists &&
      change.after.exists &&
      dataBefore?.status !== "Enviado" &&
      dataAfter?.status === "Enviado"
    ) {
      functions.logger.info(`Ofício enviado: ${oficioId}`, dataAfter);
      notificationPayload = {
        notification: {
          title: "Ofício Enviado!",
          body: `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`,
          icon: "/icons/icon-192x192.png",
          data: {
            url: `/oficios/${oficioId}`,
          },
        },
      };
    }

    // Se não houver payload, não faz nada
    if (!notificationPayload) {
      functions.logger.info("Nenhuma condição de notificação atendida.");
      return null;
    }

    try {
      // Busca todas as inscrições do Firestore
      const subscriptionsSnapshot = await db
        .collection("pushSubscriptions")
        .get();
      const subscriptions = subscriptionsSnapshot.docs.map((doc) =>
        doc.data().subscription
      );

      if (subscriptions.length === 0) {
        functions.logger.info("Nenhuma inscrição encontrada para notificar.");
        return null;
      }

      functions.logger.info(
        `Enviando notificação para ${subscriptions.length} inscritos.`
      );

      // Envia a notificação para cada inscrição
      const sendPromises = subscriptions.map((sub) =>
        webpush.sendNotification(sub, JSON.stringify(notificationPayload))
      );

      await Promise.all(sendPromises);

      functions.logger.info("Notificações enviadas com sucesso!");
      return { success: true };
    } catch (error) {
      functions.logger.error("Erro ao enviar notificações push:", error);
      // Aqui você pode adicionar lógica para limpar inscrições inválidas
      return { error: "Falha ao enviar notificações." };
    }
  });
