
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

function getNotificationPayload(
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext
): admin.messaging.Notification | null {
  const oficioId = context.params.oficioId;
  const dataAfter = change.after.data();
  const dataBefore = change.before.data();

  // Caso 1: Novo ofício criado.
  if (!change.before.exists && change.after.exists && dataAfter) {
    functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
    return {
      title: "Novo Ofício Criado!",
      body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
    };
  }

  // Caso 2: Ofício atualizado para "Enviado".
  if (
    change.before.exists &&
    change.after.exists &&
    dataBefore?.status !== "Enviado" &&
    dataAfter?.status === "Enviado"
  ) {
    functions.logger.info(`Ofício enviado: ${oficioId}`, dataAfter);
    return {
      title: "Ofício Enviado!",
      body: `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`,
    };
  }

  return null;
}

export const sendOficioNotification = functions
  .region("southamerica-east1")
  .firestore.document("oficios/{oficioId}")
  .onWrite(async (change, context) => {
    const notification = getNotificationPayload(change, context);

    if (!notification) {
      functions.logger.info("Nenhuma condição de notificação atendida.");
      return null;
    }

    const subscriptionsSnapshot = await db.collection("pushSubscriptions").get();
    if (subscriptionsSnapshot.empty) {
      functions.logger.info("Nenhuma inscrição encontrada para notificar.");
      return null;
    }

    const tokens = subscriptionsSnapshot.docs
      .map((doc) => doc.data()?.token)
      .filter((token): token is string => !!token);

    if (tokens.length === 0) {
      functions.logger.warn("Documentos de inscrição encontrados, mas nenhum token válido.");
      return null;
    }

    functions.logger.info(`Enviando notificação para ${tokens.length} inscritos.`);
    const message: admin.messaging.MulticastMessage = {
      notification,
      webpush: {
        fcmOptions: { link: `/oficios/${context.params.oficioId}` },
        notification: { icon: "/icons/icon-192x192.png" },
      },
      tokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      functions.logger.info(
        `Notificações enviadas: ${response.successCount} com sucesso, ${response.failureCount} falharam.`
      );
      // Opcional: Lógica para limpar tokens inválidos pode ser adicionada aqui.
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      functions.logger.error("Erro ao enviar notificações push:", errorMessage, error);
    }

    return null;
  });
