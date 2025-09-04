
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Função v2 acionada na criação ou atualização de um ofício para enviar notificações.
 */
export const sendoficionotification = onDocumentWritten(
  "oficios/{oficioId}",
  async (event) => {
    const oficioId = event.params.oficioId;
    const dataAfter = event.data?.after.data();
    const dataBefore = event.data?.before.data();

    let notification;
    let webpush;

    // Caso 1: Novo ofício criado.
    if (!event.data?.before.exists && event.data?.after.exists && dataAfter) {
      logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
      notification = {
        title: "Novo Ofício Criado!",
        body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
      };
      webpush = {
        fcmOptions: {
          link: `/oficios/${oficioId}`,
        },
        notification: {
          icon: "/icons/icon-192x192.png",
        },
      };
    } else if (
      // Caso 2: Ofício atualizado para "Enviado".
      event.data?.before.exists &&
      event.data?.after.exists &&
      dataBefore?.status !== "Enviado" &&
      dataAfter?.status === "Enviado"
    ) {
      logger.info(`Ofício enviado: ${oficioId}`, dataAfter);
      notification = {
        title: "Ofício Enviado!",
        body: `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`,
      };
      webpush = {
        fcmOptions: {
          link: `/oficios/${oficioId}`,
        },
        notification: {
          icon: "/icons/icon-192x192.png",
        },
      };
    }

    // Se nenhuma condição de notificação foi atendida, encerra a execução.
    if (!notification) {
      logger.info("Nenhuma condição de notificação atendida.");
      return null;
    }

    try {
      // Busca todas as inscrições de push no Firestore.
      const subscriptionsSnapshot = await db
        .collection("pushSubscriptions")
        .get();

      if (subscriptionsSnapshot.empty) {
        logger.info("Nenhuma inscrição encontrada para notificar.");
        return null;
      }

      // Mapeia e filtra para garantir que apenas inscrições válidas sejam usadas.
      // E usa um Set para garantir que cada token seja único.
      const tokensSet = new Set(
        subscriptionsSnapshot.docs
          .map((doc) => doc.data()?.token)
          .filter((token): token is string => !!token)
      );
      
      const tokens = Array.from(tokensSet);


      if (tokens.length === 0) {
        logger.warn(
          "Documentos de inscrição encontrados, mas nenhum continha um 'token' válido."
        );
        return null;
      }

      logger.info(`Enviando notificação para ${tokens.length} inscritos únicos.`);
      const message = {
        notification,
        webpush,
        tokens,
      };

      // Envia a notificação para todos os tokens
      const response = await messaging.sendEachForMulticast(message);
      logger.info(
        `Notificações enviadas: ${response.successCount} com sucesso, ${response.failureCount} falharam.`
      );

      // Limpeza de tokens inválidos (opcional, mas boa prática)
      const tokensToDelete: Promise<FirebaseFirestore.WriteResult>[] = [];
      response.responses.forEach(async (result, index) => {
        const token = tokens[index];
        if (!result.success && result.error) {
          logger.error(`Falha ao enviar para o token: ${token}`, result.error);
          const errorCode = result.error.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            logger.info(`Agendando remoção do token inválido: ${token}`);
            const subToDeleteQuery = await db.collection("pushSubscriptions").where("token", "==", token).get();
            subToDeleteQuery.forEach((doc) => {
              tokensToDelete.push(doc.ref.delete());
            });
          }
        }
      });

      await Promise.all(tokensToDelete);

      return { success: true, ...response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Erro ao enviar notificações push:", error);
      return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
  }
);
