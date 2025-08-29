
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

// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();

const db = admin.firestore();

// Configura as chaves VAPID a partir das variáveis de ambiente das funções
// Use: firebase functions:config:set vapid.public_key="..." vapid.private_key="..."
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
 * Função acionada na criação ou atualização de um ofício para enviar notificações.
 */
export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    // Se as chaves VAPID não estiverem configuradas, a função não prossegue.
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

    // Caso 1: Novo ofício criado.
    if (!change.before.exists && change.after.exists && dataAfter) {
      functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
      notificationPayload = {
        notification: {
          title: "Novo Ofício Criado!",
          body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
          icon: "/icons/icon-192x192.png",
          data: {
            url: `/oficios/${oficioId}`,
          },
        },
      };
    } else if (
      // Caso 2: Ofício atualizado para "Enviado".
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

    // Se nenhuma condição de notificação foi atendida, encerra a execução.
    if (!notificationPayload) {
      functions.logger.info("Nenhuma condição de notificação atendida.");
      return null;
    }

    try {
      // Busca todas as inscrições de push no Firestore.
      // O SDK Admin ignora as regras de segurança por padrão.
      const subscriptionsSnapshot = await db
        .collection("pushSubscriptions")
        .get();

      if (subscriptionsSnapshot.empty) {
        functions.logger.info("Nenhuma inscrição encontrada para notificar.");
        return null;
      }

      // Mapeia e filtra para garantir que apenas inscrições válidas sejam usadas.
      const subscriptions = subscriptionsSnapshot.docs
        .map((doc) => doc.data()?.subscription)
        .filter((sub): sub is webpush.PushSubscription => !!sub);


      if (subscriptions.length === 0) {
        functions.logger.warn(
          "Documentos de inscrição encontrados, mas nenhum continha um objeto 'subscription' válido."
        );
        return null;
      }

      functions.logger.info(
        `Enviando notificação para ${subscriptions.length} inscritos.`
      );

      // Prepara todas as promessas de envio de notificação.
      const sendPromises = subscriptions.map((sub) =>
        webpush.sendNotification(sub, JSON.stringify(notificationPayload))
      );

      // Aguarda o envio de todas as notificações.
      await Promise.all(sendPromises);

      functions.logger.info("Notificações enviadas com sucesso!");
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      functions.logger.error("Erro ao enviar notificações push:", error);
      // Aqui você pode adicionar lógica para limpar inscrições inválidas se necessário.
      return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
  });
