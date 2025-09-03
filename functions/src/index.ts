
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    const oficioId = context.params.oficioId;
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();

    let notificationTitle: string | undefined;
    let notificationBody: string | undefined;

    // Novo ofício criado
    if (!change.before.exists && change.after.exists && dataAfter) {
      notificationTitle = "Novo Ofício Criado!";
      notificationBody = `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`;
      functions.logger.info(`Novo ofício criado: ${oficioId}`, { data: dataAfter });
    } 
    // Ofício atualizado para "Enviado"
    else if (
      change.before.exists &&
      change.after.exists &&
      dataBefore?.status !== "Enviado" &&
      dataAfter?.status === "Enviado"
    ) {
      notificationTitle = "Ofício Enviado!";
      notificationBody = `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`;
      functions.logger.info(`Ofício enviado: ${oficioId}`, { data: dataAfter });
    }

    if (!notificationTitle || !notificationBody) {
      functions.logger.info("Nenhuma condição de notificação atendida.");
      return null;
    }

    try {
      const subscriptionsSnapshot = await db.collection("pushSubscriptions").get();
      if (subscriptionsSnapshot.empty) {
        functions.logger.info("Nenhuma inscrição de push encontrada.");
        return null;
      }

      const tokens = subscriptionsSnapshot.docs
        .map((doc) => doc.data()?.token)
        .filter((token): token is string => !!token);
      
      if (tokens.length === 0) {
        functions.logger.warn("Documentos de inscrição encontrados, mas sem tokens válidos.");
        return null;
      }

      functions.logger.info(`Enviando notificação para ${tokens.length} tokens.`);

      const message: admin.messaging.MulticastMessage = {
        tokens: tokens,
        notification: {
          title: notificationTitle,
          body: notificationBody,
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

      const response = await messaging.sendEachForMulticast(message);
      functions.logger.info(`Notificações enviadas: ${response.successCount} com sucesso, ${response.failureCount} com falha.`);

      // Limpeza de tokens inválidos
      const tokensToDelete: Promise<admin.firestore.WriteResult>[] = [];
      response.responses.forEach((result, index) => {
        const token = tokens[index];
        if (!result.success) {
          const errorCode = result.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            functions.logger.info(`Agendando remoção do token inválido: ${token}`);
            const subToDeleteQuery = db.collection("pushSubscriptions").where("token", "==", token);
            tokensToDelete.push(
              subToDeleteQuery.get().then(querySnapshot => {
                const deletePromises: Promise<admin.firestore.WriteResult>[] = [];
                querySnapshot.forEach(doc => {
                  deletePromises.push(doc.ref.delete());
                });
                return Promise.all(deletePromises).then(() => Promise.resolve()) as any;
              })
            );
          } else {
             functions.logger.error(`Falha ao enviar para ${token}`, result.error);
          }
        }
      });
      await Promise.all(tokensToDelete);

      return { success: true, ...response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      functions.logger.error("Erro geral ao enviar notificações:", { error: errorMessage, details: error });
      return { success: false, error: `Falha ao enviar notificações: ${errorMessage}` };
    }
  });
