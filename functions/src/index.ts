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

// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Função acionada na criação ou atualização de um ofício para enviar notificações.
 */
export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    const oficioId = context.params.oficioId;
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();

    let notificationPayload: admin.messaging.MessagingPayload | null = null;

    // Caso 1: Novo ofício criado.
    if (!change.before.exists && change.after.exists && dataAfter) {
      functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
      notificationPayload = {
        notification: {
          title: "Novo Ofício Criado!",
          body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
        },
        webpush: {
          fcmOptions: {
            link: `/oficios/${oficioId}`,
          },
          notification: {
            icon: "/icons/icon-192x192.png",
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
        },
        webpush: {
          fcmOptions: {
            link: `/oficios/${oficioId}`,
          },
          notification: {
            icon: "/icons/icon-192x192.png",
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
      const tokens = subscriptionsSnapshot.docs
        .map((doc) => doc.data()?.token)
        .filter((token): token is string => !!token);


      if (tokens.length === 0) {
        functions.logger.warn(
          "Documentos de inscrição encontrados, mas nenhum continha um 'token' válido."
        );
        return null;
      }

      functions.logger.info(
        `Enviando notificação para ${tokens.length} inscritos.`
      );

      // Envia a notificação para todos os tokens
      const response = await messaging.sendEachForMulticast({
        tokens: tokens,
        ...notificationPayload,
      });

      functions.logger.info(
        `Notificações enviadas: 
        ${response.successCount} com sucesso, 
        ${response.failureCount} falharam.`
      );

      // Limpeza de tokens inválidos
      const tokensToDelete: Promise<any>[] = [];
      response.responses.forEach(async (result, index) => {
        const token = tokens[index];
        if (!result.success) {
          functions.logger.error(`Falha ao enviar para o token: ${token}`, result.error);
          const errorCode = result.error.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            functions.logger.info(`Agendando remoção do token inválido: ${token}`);
            const subToDeleteQuery = db.collection("pushSubscriptions").where("token", "==", token).get();
            tokensToDelete.push(subToDeleteQuery.then((snapshot) => {
              snapshot.forEach((doc) => doc.ref.delete());
            }));
          }
        }
      });
      await Promise.all(tokensToDelete);

      return { success: true, ...response };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      functions.logger.error("Erro ao enviar notificações push:", error);
      return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
  });
