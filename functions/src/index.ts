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

// As chaves VAPID são lidas das variáveis de ambiente do ambiente da função.
// Elas devem ser definidas no seu ambiente de nuvem (ex: via apphosting.yaml).
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Adiciona log para verificar se as chaves estão sendo carregadas no ambiente da função
if (vapidPublicKey && vapidPrivateKey) {
  functions.logger.info("VAPID keys loaded successfully from environment variables.");
  webpush.setVapidDetails(
    "mailto:jardel.lc@gmail.com", // Substitua pelo seu e-mail de contato
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  functions.logger.error(
    "VAPID keys not configured in Firebase Functions environment. Push notifications will be disabled.",
    {
      hasPublicKey: !!vapidPublicKey,
      hasPrivateKey: !!vapidPrivateKey,
    });
}


/**
 * Função acionada na criação ou atualização de um ofício para enviar notificações.
 */
export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    // Se as chaves VAPID não estiverem configuradas, a função não prossegue.
    if (!vapidPublicKey || !vapidPrivateKey) {
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
        webpush.sendNotification(sub, JSON.stringify(notificationPayload)).catch((error) => {
          functions.logger.error(`Failed to send notification to endpoint: ${sub.endpoint}`, error);
          // Opcional: Lógica para remover inscrições inválidas (ex: erro 410 Gone)
          if (error.statusCode === 410) {
            functions.logger.info(`Subscription ${sub.endpoint} is gone. Consider removing it.`);
            // Você pode adicionar código aqui para remover a inscrição do Firestore.
          }
        })
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
